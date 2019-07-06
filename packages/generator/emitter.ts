import { Service, Method, Argument, TypeSymbol } from './metadata';
import { relative, isAbsolute } from 'path';

type SymbolName = string;
type ImportPath = string;

const builtIns = [
  {
    name: 'Injectable',
    path: '@angular/core'
  },
  {
    name: 'Inject',
    path: '@angular/core'
  },
  {
    name: 'grpcUnary',
    path: 'ts-rpc'
  },
  {
    name: 'FetchFn',
    path: 'ts-rpc'
  },
  {
    name: 'Fetch',
    path: 'ts-rpc'
  },
  {
    name: 'Host',
    path: 'ts-rpc'
  }
];

export class SymbolTable {
  private map: ImportMap;

  constructor(services: Service[]) {
    this.map = {
      symbols: new Map(),
      imports: new Map()
    };
    if (!services.length) return;
    services.forEach(s => this.addSymbol(s.name, ''));
    services.forEach(s => this.addSymbol(s.name, s.path));
    builtIns.forEach(s => this.addSymbol(s.name, s.path));
  }

  get imports() {
    return this.map.imports;
  }

  addSymbol(name: string, path: string) {
    if (!this.map.symbols.has(name)) {
      this.map.symbols.set(name, {
        total: -1,
        importName: new Map()
      });
    }
    const current = this.map.symbols.get(name)!;
    if (!current.importName.has(path)) {
      current.total += 1;
      current.importName.set(path, current.total);
    }
    if (!this.map.imports.has(path)) {
      this.map.imports.set(path, new Set());
    }
    this.map.imports.get(path)!.add(name);
  }

  getSymbolName(name: string, path: string) {
    if (!path) {
      return name;
    }
    const res = this.map.symbols.get(name);
    if (!res) {
      throw new Error(`Cannot find the symbol ${name} in the imports map`);
    }
    const num = res.importName.get(path);
    if (num === 0) {
      return name;
    }
    return `${name}${num}`;
  }
}

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

const handleImport = (table: SymbolTable, type: TypeSymbol) => {
  (type.params || []).forEach(type => handleImport(table, type));
  (type.nested || []).forEach(type => handleImport(table, type));

  if (!type.path) {
    return;
  }

  table.addSymbol(type.name, type.path);
};

const getTypeName = (table: SymbolTable, type: TypeSymbol) => {
  if (!type.path) {
    return type.name;
  }
  return table.getSymbolName(type.name, type.path);
};

export const emitType = (imports: SymbolTable, type: TypeSymbol): string => {
  handleImport(imports, type);
  if (!type.params) {
    return getTypeName(imports, type);
  }
  return `${getTypeName(imports, type)}<${type.params
    .map(param => emitType(imports, param))
    .join(', ')}>`;
};

const emitArgument = (imports: SymbolTable, arg: Argument) => {
  return `${arg.name}: ${emitType(imports, arg.type)}`;
};

const emitMethodBody = (table: SymbolTable, method: Method) => {
  return `return this.c<${emitType(table, method.returnType)}>(${method.sideEffect}, '${
    method.name
  }'${method.arguments.length ? ', ' : ''}${method.arguments.map(a => a.name).join(', ')});`;
};

const emitMethod = (table: SymbolTable, method: Method) => {
  return `  ${method.name}(${method.arguments
    .map(emitArgument.bind(null, table))
    .join(', ')}): ${emitType(table, {
    name: 'Promise',
    path: '',
    params: [method.returnType]
  })} {
    ${emitMethodBody(table, method)}
  }`;
};

const emitService = (imports: SymbolTable, service: Service) => {
  return `@Injectable()
export class ${service.name} implements ${imports.getSymbolName(service.name, service.path)} {
  private c: <T>(sideEffect: boolean, method: string, ...args: any[]) => Promise<T>;
  constructor(@Inject(Fetch) fetch: FetchFn, @Inject(Host) host: string) {
    this.c = grpcUnary.bind(null, fetch, host, '${service.name}');
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

const serializeImports = (currentPath: string, table: SymbolTable) => {
  return [...table.imports]
    .filter(([path]) => path !== '')
    .map(([path, symbols]) => {
      return (
        'import {' +
        [...symbols]
          .map(s => {
            const name = getTypeName(table, {
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

export const emit = (path: string, services: Service[]): string => {
  if (!isAbsolute(path)) {
    throw new Error('The specified output path should be absolute');
  }
  const imports = new SymbolTable(services);
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
