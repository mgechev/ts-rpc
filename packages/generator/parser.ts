import * as ts from 'typescript';

import { Service, Method, Argument, TypeSymbol } from './metadata';

type Result = { services: Service[]; diagnostic: ts.Diagnostic[] };

const getTypeFromSymbol = (s: ts.Symbol) => {
  return {
    name: s.name,
    path: s.declarations[0].getSourceFile().fileName
  };
};

const getTypeFromNode = (node: ts.Node, tch: ts.TypeChecker) => {
  if (ts.isTypeReferenceNode(node)) {
    return tch.getTypeAtLocation((node as ts.TypeReferenceNode).typeName);
  }
  return tch.getTypeAtLocation(node);
};

const getTypeLiteralNestedTypes = (s: ts.Symbol, tch: ts.TypeChecker): TypeSymbol[] => {
  if (!s.members) return [];
  const result: TypeSymbol[] = [];
  s.members.forEach(t => {
    const type = getType(t.declarations[0], tch);
    if (!type) return;
    result.push(type);
  });
  return result;
};

const getType = (node: ts.Node | ts.Type, tch: ts.TypeChecker): TypeSymbol | null => {
  const type: ts.Type =
    (node as any).kind !== undefined ? getTypeFromNode(node as ts.Node, tch) : (node as ts.Type);
  let result: TypeSymbol | null = null;
  if (type.aliasSymbol && type.aliasSymbol.declarations) {
    result = getTypeFromSymbol(type.aliasSymbol);
  } else if (type.symbol) {
    if (type.symbol.name === '__type') {
      // Anonymous type literal
      result = {
        name: type.symbol.declarations[0].getText(),
        path: '',
        nested: getTypeLiteralNestedTypes(type.symbol, tch)
      };
    } else {
      result = getTypeFromSymbol(type.symbol);
    }
  }
  if (type && (type as any).intrinsicName) {
    return {
      name: (type as any).intrinsicName,
      path: ''
    };
  }
  if (!result) {
    return null;
  }
  if (
    !(node as any).typeArguments &&
    !(type as any).typeArguments &&
    !type.aliasTypeArguments &&
    !(type as any).intrinsicName
  ) {
    return result;
  }
  result.params = (
    (node as any).typeArguments ||
    type.aliasTypeArguments ||
    (type as any).typeArguments
  ).map((t: ts.Node) => getType(t, tch));
  return result;
};

const isRPCServiceInterface = (expr: ts.ExpressionWithTypeArguments, program: ts.Program) => {
  const tch = program.getTypeChecker();
  const symbol = tch.getSymbolAtLocation(expr.expression);
  if (!symbol) return false;
  const type = getType(expr, tch);
  if (!type) return false;
  return type.name === 'Service' && type.path.includes('node_modules/ts-rpc');
};

const isRPCService = (n: ts.Node, program: ts.Program): boolean => {
  if (n.kind !== ts.SyntaxKind.InterfaceDeclaration) {
    return false;
  }
  const intr = <ts.InterfaceDeclaration>n;
  if (!intr.heritageClauses) {
    return false;
  }
  return intr.heritageClauses.some(h => {
    if (!h.types.length) return false;
    return h.types.some(expr => isRPCServiceInterface(expr, program));
  });
};

const hasSideEffects = (
  m: ts.MethodSignature,
  program: ts.Program,
  diagnostic: ts.Diagnostic[]
): boolean => {
  const type = m.type as any;
  const tch = program.getTypeChecker();
  if (!type.typeArguments || type.typeArguments.length !== 1) return true;
  const arg = tch.getTypeAtLocation(type.typeArguments[0]) as any;
  const methodType = tch.getTypeAtLocation(m);

  const voidType = arg && arg.intrinsicName === 'void';
  let sideEffect = voidType;
  if (methodType.symbol.valueDeclaration.kind === ts.SyntaxKind.MethodSignature) {
    const valueDeclaration = methodType.symbol.valueDeclaration as ts.MethodSignature;
    const typeParams = ((valueDeclaration.typeParameters || []) as any[])
      .map(p => getType(p, tch))
      .filter(t => t !== null);
    if (typeParams.length > 1) {
      diagnostic.push({
        messageText:
          'Methods of RPC services cannot specify generic parameters. They can only indicate if the method is readonly',
        code: 55555,
        category: ts.DiagnosticCategory.Error,
        file: valueDeclaration.getSourceFile(),
        start: valueDeclaration.getStart(),
        length: valueDeclaration.getEnd() - valueDeclaration.getStart()
      });
    }
    sideEffect = typeParams.length === 0 || typeParams[0]!.name !== 'Read';
  }
  if (voidType && !sideEffect) {
    diagnostic.push({
      messageText: 'Methods of type void cannot be declared as side-effect free',
      code: 55555,
      category: ts.DiagnosticCategory.Error,
      file: m.getSourceFile(),
      start: m.getStart(),
      length: m.getEnd() - m.getStart()
    });
    sideEffect = true;
  }
  return sideEffect;
};

const parseArguments = (
  m: ts.MethodSignature,
  program: ts.Program,
  diagnostic: ts.Diagnostic[]
): Argument[] => {
  const tch = program.getTypeChecker();
  return m.parameters
    .map(p => {
      const type = getType(p, tch);
      if (type === null) {
        diagnostic.push({
          messageText: 'Cannot resolve the argument type',
          code: 55555,
          category: ts.DiagnosticCategory.Error,
          file: m.getSourceFile(),
          start: m.getStart(),
          length: m.getEnd() - m.getStart()
        });
        return null;
      }
      return {
        type,
        name: p.name.getText()
      };
    })
    .filter(arg => arg !== null) as Argument[];
};

const parseMethod = (
  n: ts.TypeElement,
  program: ts.Program,
  diagnostic: ts.Diagnostic[]
): Method | null => {
  if (n.kind !== ts.SyntaxKind.MethodSignature) {
    return null;
  }
  const method = n as ts.MethodSignature;
  const type = method.type as any;
  if (!type || !type.typeName || type.typeName.text !== 'Promise') {
    diagnostic.push({
      messageText: 'All methods of a RPC service must return a Promise',
      code: 55555,
      category: ts.DiagnosticCategory.Error,
      file: n.getSourceFile(),
      start: n.getStart(),
      length: n.getEnd() - n.getStart()
    });
    return null;
  }
  const returnType = getType(type.typeArguments[0], program.getTypeChecker());
  if (!returnType) return null;
  return {
    name: method.name.getText(),
    returnType,
    sideEffect: hasSideEffects(method, program, diagnostic),
    arguments: parseArguments(method, program, diagnostic)
  };
};

const parseMethods = (
  n: ts.InterfaceDeclaration,
  program: ts.Program,
  diagnostic: ts.Diagnostic[]
): Method[] => {
  return n.members
    .map(m => parseMethod(m, program, diagnostic))
    .filter(m => m !== null) as Method[];
};

const parseService = (
  n: ts.InterfaceDeclaration,
  program: ts.Program,
  diagnostic: ts.Diagnostic[]
): Service | null => {
  const name = n.name.getText();
  if (n.typeParameters && n.typeParameters.length) {
    diagnostic.push({
      category: ts.DiagnosticCategory.Error,
      code: 55555,
      start: n.typeParameters.pos,
      length: n.typeParameters.length,
      messageText: 'Cannot declare type parameters of a RPC service',
      file: n.getSourceFile()
    });
    return null;
  }
  return {
    name,
    path: n.getSourceFile().fileName,
    methods: parseMethods(n, program, diagnostic)
  } as Service;
};

const parseFile = (
  source: ts.SourceFile,
  program: ts.Program,
  diagnostic: ts.Diagnostic[]
): Service[] => {
  const result: Service[] = [];
  source.forEachChild(c => {
    if (!isRPCService(c, program)) return;
    const service = parseService(c as ts.InterfaceDeclaration, program, diagnostic);
    if (service) {
      result.push(service);
    }
  });
  return result;
};

export const parse = (program: ts.Program): Result => {
  const diagnostic: ts.Diagnostic[] = [...program.getGlobalDiagnostics()];
  const services = ([] as Service[]).concat.apply(
    [],
    program.getSourceFiles().map(sf => parseFile(sf, program, diagnostic))
  );
  return {
    services,
    diagnostic
  };
};
