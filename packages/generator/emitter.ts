import { Service, Method, Argument, TypeSymbol } from './metadata';
import { relative, isAbsolute } from 'path';

type SymbolName = string;
type ImportPath = string;

export type ImportMap = {
  symbols: Map<
    SymbolName,
    {
      total: number;
      importName: Map<ImportPath, number>;
    }
  >;
  imports: Map<ImportPath, Set<SymbolName>>;
};

const handleImport = (i: ImportMap, type: TypeSymbol) => {
  (type.params || []).forEach(type => handleImport(i, type));

  if (!type.path) {
    return;
  }
  const { symbols, imports } = i;
  if (!symbols.has(type.name)) {
    symbols.set(type.name, {
      total: -1,
      importName: new Map()
    });
  }
  const current = symbols.get(type.name)!;
  if (!current.importName.has(type.path)) {
    current.total += 1;
    current.importName.set(type.path, current.total);
  }
  if (!imports.has(type.path)) {
    imports.set(type.path, new Set());
  }
  imports.get(type.path)!.add(type.name);
};

const getTypeName = (imports: ImportMap, type: TypeSymbol) => {
  if (!type.path) {
    return type.name;
  }
  const res = imports.symbols.get(type.name);
  if (!res) {
    throw new Error(`Cannot find the symbol ${type.name} in the imports map`);
  }
  const num = res.importName.get(type.path);
  if (num === 0) {
    return type.name;
  }
  return `${type.name}${num}`;
};

export const emitType = (imports: ImportMap, type: TypeSymbol): string => {
  handleImport(imports, type);
  if (!type.params) {
    return getTypeName(imports, type);
  }
  return `${getTypeName(imports, type)}<${type.params
    .map(param => emitType(imports, param))
    .join(', ')}>`;
};

const emitArgument = (imports: ImportMap, arg: Argument) => {
  return `${arg.name}: ${emitType(imports, arg.type)}`;
};

const emitMethodBody = (method: Method) => {
  return `this.c('${method.name}'${method.arguments.length ? ', ' : ''}${method.arguments
    .map(a => a.name)
    .join(', ')});`;
};

const emitMethod = (imports: ImportMap, method: Method) => {
  return `  ${method.name}(${method.arguments
    .map(emitArgument.bind(null, imports))
    .join(', ')}): ${emitType(imports, {
    name: 'Promise',
    path: '',
    params: [method.returnType]
  })} {
    ${emitMethodBody(method)}
  }`;
};

const emitService = (imports: ImportMap, service: Service) => {
  return `@Injectable()
export class ${service.name} {
  constructor(@Inject(Fetch) fetch: FetchFn) {
    this.c = grpcUnary.bind(null, fetch, '${service.name}');
  }
${service.methods.map(emitMethod.bind(null, imports)).join('\n')}
}`;
};

const getImportPath = (currentPath: string, path: string) => {
  if (!path.startsWith('./') && !path.startsWith('/')) {
    return path;
  }
  path = path.replace(/\.ts$/, '');
  const result = relative(currentPath, path);
  if (!result.startsWith('.')) {
    return `./${result}`;
  }
  return result;
};

const serializeImports = (currentPath: string, imports: ImportMap) => {
  return [...imports.imports]
    .map(([path, symbols]) => {
      return (
        'import {' +
        [...symbols]
          .map(s => {
            const name = getTypeName(imports, {
              name: s,
              path
            });
            if (name === s) {
              return s;
            }
            return `${s} as ${name}`;
          })
          .join(', ') +
        `} from '${getImportPath(currentPath, path)}';`
      );
    })
    .join('\n');
};

const getDefaultImportMap = (services: Service[]): ImportMap =>
  services.length
    ? {
        symbols: new Map([
          [
            'Inject',
            {
              total: 0,
              importName: new Map([['@angular/core', 0]])
            }
          ],
          [
            'Injectable',
            {
              total: 0,
              importName: new Map([['@angular/core', 0]])
            }
          ],
          [
            'Fetch',
            {
              total: 0,
              importName: new Map([['ts-rpc', 0]])
            }
          ],
          [
            'FetchFn',
            {
              total: 0,
              importName: new Map([['ts-rpc', 0]])
            }
          ],
          [
            'grpcUnary',
            {
              total: 0,
              importName: new Map([['ts-rpc', 0]])
            }
          ]
        ]),
        imports: new Map([
          ['@angular/core', new Set(['Injectable', 'Inject'])],
          ['ts-rpc', new Set(['Fetch', 'FetchFn', 'grpcUnary'])]
        ])
      }
    : {
        symbols: new Map(),
        imports: new Map()
      };

export const emit = (path: string, services: Service[]): string => {
  if (!isAbsolute(path)) {
    throw new Error('The specified output path should be absolute');
  }
  const imports = getDefaultImportMap(services);
  services.forEach(first => {
    services.forEach(second => {
      if (second !== first && second.name === first.name) {
        throw new Error(`Two services with the same name: "${first.name}"`);
      }
    });
  });
  const emittedServices = services.map(emitService.bind(null, imports)).join('\n\n');
  return serializeImports(path, imports) + '\n\n' + emittedServices;
};
