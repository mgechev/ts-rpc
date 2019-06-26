import * as ts from 'typescript';

import { Service, Method, Argument, TypeSymbol } from './metadata';

const getAliasSymbols = (type: ts.Type, tch: ts.TypeChecker) => {
  const symbol = type.getSymbol();
  if (symbol && symbol.declarations && symbol.declarations.length) {
    return (type.aliasSymbol ? [type.aliasSymbol] : []).concat(
      tch
        .getSymbolsInScope(symbol.declarations[0], ts.SymbolFlags.TypeAlias)
        .filter(s => type === tch.getDeclaredTypeOfSymbol(s))
    );
  }
  return type.aliasSymbol ? [type.aliasSymbol] : [];
};

const findSymbol = (node: ts.Node, tch: ts.TypeChecker): TypeSymbol | null => {
  const type = tch.getTypeAtLocation(node);
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

const parseMethods = (n: ts.InterfaceDeclaration, program: ts.Program) => {
  return [];
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
