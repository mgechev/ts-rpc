import * as ts from 'typescript';

import { Service, Method, Argument, TypeSymbol } from './metadata';

const getTypeFromSymbol = (s: ts.Symbol) => {
  return {
    name: s.name,
    path: s.declarations[0].getSourceFile().fileName
  };
};

const getType = (node: ts.Node, tch: ts.TypeChecker): TypeSymbol | null => {
  let type: ts.Type;
  if (ts.isTypeReferenceNode(node)) {
    type = tch.getTypeAtLocation((node as ts.TypeReferenceNode).typeName);
  } else {
    type = tch.getTypeAtLocation(node);
  }
  let result: TypeSymbol | null = null;
  if (type.aliasSymbol && type.aliasSymbol.declarations) {
    result = getTypeFromSymbol(type.aliasSymbol);
  } else if (type.symbol) {
    result = getTypeFromSymbol(type.symbol);
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
  if (!(node as any).typeArguments && !(type as any).intrinsicName) {
    return result;
  }
  result.params = ((node as any).typeArguments).map((t: ts.Node) => getType(t, tch));
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

const hasSideEffects = (m: ts.MethodSignature, program: ts.Program): boolean => {
  const type = m.type as any;
  const tch = program.getTypeChecker();
  if (!type.typeArguments || type.typeArguments.length !== 1) return true;
  const t = getType(type.typeArguments[0], tch);
  const arg = tch.getTypeAtLocation(type.typeArguments[0]) as any;
  const methodType = tch.getTypeAtLocation(m);

  const voidType = arg && arg.intrinsicName === 'void';
  let sideEffect = voidType;
  if (methodType.symbol.valueDeclaration.kind === ts.SyntaxKind.MethodSignature) {
    const valueDeclaration = methodType.symbol.valueDeclaration as ts.MethodSignature;
    const typeParams = ((valueDeclaration.typeParameters || []) as any[]).map(p => getType(p, tch))
      .filter(t => t !== null);
    if (typeParams.length > 1) {
      // TODO(mgechev): report an error
    }
    sideEffect = typeParams.length === 0 || typeParams[0]!.name !== 'Read';
  }
  if (voidType && !sideEffect) {
    // TODO(mgechev): report an error
    sideEffect = true;
  }
  return sideEffect;
};

const parseArguments = (m: ts.MethodSignature, program: ts.Program): Argument[] => {
  const tch = program.getTypeChecker();
  return m.parameters.map(p => {
    const type = getType(p, tch);
    if (type === null) {
      // TODO(mgechev): report error for unresolvable type
      return null;
    }
    return {
      type,
      name: p.name.getText()
    };
  }).filter(arg => arg !== null) as Argument[];
};

const parseMethod = (n: ts.TypeElement, program: ts.Program): Method | null => {
  if (n.kind !== ts.SyntaxKind.MethodSignature) {
    return null;
  }
  const method = n as ts.MethodSignature;
  const type = method.type as any;
  if (!type || !type.typeName || type.typeName.text !== 'Promise') {
    // TODO(mgechev): report as an error, every method should be async.
    return null;
  }
  const returnType = getType(type.typeArguments[0], program.getTypeChecker());
  if (!returnType) return null;
  return {
    name: method.name.getText(),
    returnType,
    sideEffect: hasSideEffects(method, program),
    arguments: parseArguments(method, program)
  };
};

const parseMethods = (n: ts.InterfaceDeclaration, program: ts.Program): Method[] => {
  return n.members.map(m => parseMethod(m, program)).filter(m => m !== null) as Method[];
};

const parseService = (n: ts.InterfaceDeclaration, program: ts.Program) => {
  const name = n.name.getText();
  return {
    name,
    methods: parseMethods(n, program)
  } as Service;
};

const parseFile = (source: ts.SourceFile, program: ts.Program): Service[] => {
  const result: Service[] = [];
  source.forEachChild(c => {
    if (!isRPCService(c, program)) return;
    result.push(parseService(c as ts.InterfaceDeclaration, program));
  });
  return result;
};

export const parse = (program: ts.Program) => {
  return ([] as Service[]).concat.apply(
    [],
    program.getSourceFiles().map(sf => parseFile(sf, program))
  );
};
