import * as ts from 'typescript';

import { Service, Method, Argument, TypeSymbol } from './metadata';

const findSymbol = (node: ts.Node, tch: ts.TypeChecker): TypeSymbol | null => {
  const type = tch.getTypeAtLocation(node);
  if (type && (type as any).intrinsicName) {
    return {
      name: (type as any).intrinsicName,
      path: ''
    };
  }
  if (type && type.symbol) {
    return {
      name: type.symbol.name,
      path: type.symbol.declarations[0].getSourceFile().fileName
    };
  }
  return null;
};

const isRPCServiceInterface = (expr: ts.ExpressionWithTypeArguments, program: ts.Program) => {
  const tch = program.getTypeChecker();
  const symbol = tch.getSymbolAtLocation(expr.expression);
  if (!symbol) return false;
  const type = findSymbol(expr, tch);
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
  const t = findSymbol(type.typeArguments[0], tch);
  const arg = tch.getTypeAtLocation(type.typeArguments[0]) as any;
  // TODO(mgechev): report as an error, every method should be async.
  if (!type || !type.typeName || type.typeName.text !== 'Promise') return true;
  const methodType = tch.getTypeAtLocation(m);

  const voidType = arg && arg.intrinsicName === 'void';
  let sideEffect = voidType;
  if (methodType.symbol.valueDeclaration.kind === ts.SyntaxKind.MethodSignature) {
    const valueDeclaration = methodType.symbol.valueDeclaration as ts.MethodSignature;
    const typeParams = ((valueDeclaration.typeParameters || []) as any[]).map(p => findSymbol(p, tch))
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
    const type = findSymbol(p, tch);
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
  if (!type.typeArguments || type.typeArguments.length !== 1) return null;
  const returnType = findSymbol(type.typeArguments[0], program.getTypeChecker());
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
