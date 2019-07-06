import { emitType, SymbolTable, emit } from '../emitter';

describe('emitType', () => {
  let table: SymbolTable;
  beforeEach(() => {
    table = new SymbolTable([]);
  });

  it('should emit simple built-in types', () => {
    expect(
      emitType(table, {
        name: 'Promise',
        path: ''
      })
    ).toEqual('Promise');
  });

  it('should emit simple types', () => {
    expect(
      emitType(table, {
        name: 'Foo',
        path: '/path.ts'
      })
    ).toEqual('Foo');
  });

  it('should emit generic types', () => {
    expect(
      emitType(table, {
        name: 'Foo',
        path: '/foo.ts',
        params: [
          {
            name: 'Qux',
            path: '/qux.ts'
          },
          {
            name: 'Bar',
            path: '/bar.ts',
            params: [
              {
                name: 'Foobar',
                path: '/foobar.ts'
              },
              {
                name: 'Qux',
                path: '/qux.ts'
              }
            ]
          }
        ]
      })
    ).toEqual('Foo<Qux, Bar<Foobar, Qux>>');
  });

  it('should rename symbols when coming from different places', () => {
    expect(
      emitType(table, {
        name: 'Foo',
        path: '/foo.ts',
        params: [
          {
            name: 'Qux',
            path: '/qux.ts'
          },
          {
            name: 'Qux',
            path: '/qux1.ts',
            params: [
              {
                name: 'Qux',
                path: '/qux2.ts'
              }
            ]
          }
        ]
      })
    ).toEqual('Foo<Qux, Qux2<Qux1>>');
  });
});

describe('emitter', () => {
  it('should serialize single service', () => {
    const result = emit('/', [
      {
        name: 'Service',
        path: '/service.ts',
        methods: [
          {
            name: 'foo',
            arguments: [],
            returnType: {
              name: 'Foo',
              path: '/foo.ts'
            },
            sideEffect: false
          }
        ]
      }
    ]);

    expect(result).toBe(
      `import {Service as Service1} from './service';
import {Injectable, Inject} from '@angular/core';
import {grpcUnary, FetchFn, Fetch, Host} from 'ts-rpc';
import {Foo} from './foo';

@Injectable()
export class Service implements Service1 {
  private c: <T>(sideEffect: boolean, method: string, ...args: any[]) => Promise<T>;
  constructor(@Inject(Fetch) fetch: FetchFn, @Inject(Host) host: string) {
    this.c = grpcUnary.bind(null, fetch, host, 'Service');
  }
  foo(): Promise<Foo> {
    return this.c<Foo>(false, 'foo');
  }
}`
    );
  });

  it('should serialize single service with multiple methods and arguments', () => {
    const result = emit('/', [
      {
        name: 'Service',
        path: '/service.ts',
        methods: [
          {
            name: 'foo',
            arguments: [
              {
                name: 'map',
                type: {
                  name: 'Map',
                  path: '',
                  params: [
                    {
                      name: 'string',
                      path: ''
                    },
                    {
                      name: 'Bar',
                      path: '/bar.ts'
                    }
                  ]
                }
              }
            ],
            returnType: {
              name: 'Foo',
              path: '/foo.ts'
            },
            sideEffect: true
          },
          {
            name: 'bar',
            arguments: [
              {
                name: 'qux',
                type: {
                  name: 'Qux',
                  path: '/foo2.ts'
                }
              },
              {
                name: 'foo',
                type: {
                  name: 'Foo',
                  path: '/foo2.ts'
                }
              }
            ],
            returnType: {
              name: 'Bar',
              path: '/bar.ts'
            },
            sideEffect: true
          }
        ]
      }
    ]);

    expect(result).toBe(
      `import {Service as Service1} from './service';
import {Injectable, Inject} from '@angular/core';
import {grpcUnary, FetchFn, Fetch, Host} from 'ts-rpc';
import {Bar} from './bar';
import {Foo} from './foo';
import {Qux, Foo as Foo1} from './foo2';

@Injectable()
export class Service implements Service1 {
  private c: <T>(sideEffect: boolean, method: string, ...args: any[]) => Promise<T>;
  constructor(@Inject(Fetch) fetch: FetchFn, @Inject(Host) host: string) {
    this.c = grpcUnary.bind(null, fetch, host, 'Service');
  }
  foo(map: Map<string, Bar>): Promise<Foo> {
    return this.c<Foo>(true, 'foo', map);
  }
  bar(qux: Qux, foo: Foo1): Promise<Bar> {
    return this.c<Bar>(true, 'bar', qux, foo);
  }
}`
    );
  });

  it('should handle relative paths', () => {
    const result = emit('/src/dist', [
      {
        name: 'Service',
        path: '/service.ts',
        methods: [
          {
            name: 'foo',
            arguments: [],
            returnType: {
              name: 'Foo',
              path: '/src/interfaces/foo.ts'
            },
            sideEffect: true
          }
        ]
      }
    ]);

    expect(result).toBe(
      `import {Service as Service1} from '../../service';
import {Injectable, Inject} from '@angular/core';
import {grpcUnary, FetchFn, Fetch, Host} from 'ts-rpc';
import {Foo} from '../interfaces/foo';

@Injectable()
export class Service implements Service1 {
  private c: <T>(sideEffect: boolean, method: string, ...args: any[]) => Promise<T>;
  constructor(@Inject(Fetch) fetch: FetchFn, @Inject(Host) host: string) {
    this.c = grpcUnary.bind(null, fetch, host, 'Service');
  }
  foo(): Promise<Foo> {
    return this.c<Foo>(true, 'foo');
  }
}`
    );
  });

  it('should throw on non-absolute path', () => {
    expect(() => emit('../', [])).toThrow();
  });

  it('should not override ts-rpc or angular symbols', () => {
    const result = emit('/src/dist', [
      {
        name: 'Service',
        path: '/service.ts',
        methods: [
          {
            name: 'foo',
            arguments: [
              {
                name: 'a',
                type: {
                  name: 'Injectable',
                  path: '/foo.ts'
                }
              },
              {
                name: 'b',
                type: {
                  name: 'grpcUnary',
                  path: '/foo.ts'
                }
              }
            ],
            returnType: {
              name: 'Inject',
              path: '/src/interfaces/foo.ts'
            },
            sideEffect: true
          }
        ]
      }
    ]);

    expect(result).toBe(
      `import {Service as Service1} from '../../service';
import {Injectable, Inject} from '@angular/core';
import {grpcUnary, FetchFn, Fetch, Host} from 'ts-rpc';
import {Injectable as Injectable1, grpcUnary as grpcUnary1} from '../../foo';
import {Inject as Inject1} from '../interfaces/foo';

@Injectable()
export class Service implements Service1 {
  private c: <T>(sideEffect: boolean, method: string, ...args: any[]) => Promise<T>;
  constructor(@Inject(Fetch) fetch: FetchFn, @Inject(Host) host: string) {
    this.c = grpcUnary.bind(null, fetch, host, 'Service');
  }
  foo(a: Injectable1, b: grpcUnary1): Promise<Inject1> {
    return this.c<Inject1>(true, 'foo', a, b);
  }
}`
    );
  });

  it('should emit complex return type as type parameter to the client', () => {
    const result = emit('/src/dist', [
      {
        name: 'Service',
        path: '/service.ts',
        methods: [
          {
            name: 'foo',
            arguments: [],
            returnType: {
              name: 'Foo',
              path: '/src/interfaces/foo.ts',
              params: [
                {
                  name: 'Bar',
                  path: '/src/interfaces/bar.ts'
                },
                {
                  name: 'Qux',
                  path: '/src/interfaces/qux.ts'
                }
              ]
            },
            sideEffect: true
          }
        ]
      }
    ]);

    expect(result).toBe(
      `import {Service as Service1} from '../../service';
import {Injectable, Inject} from '@angular/core';
import {grpcUnary, FetchFn, Fetch, Host} from 'ts-rpc';
import {Bar} from '../interfaces/bar';
import {Qux} from '../interfaces/qux';
import {Foo} from '../interfaces/foo';

@Injectable()
export class Service implements Service1 {
  private c: <T>(sideEffect: boolean, method: string, ...args: any[]) => Promise<T>;
  constructor(@Inject(Fetch) fetch: FetchFn, @Inject(Host) host: string) {
    this.c = grpcUnary.bind(null, fetch, host, 'Service');
  }
  foo(): Promise<Foo<Bar, Qux>> {
    return this.c<Foo<Bar, Qux>>(true, 'foo');
  }
}`
    );
  });

  it('should emit anonymous literal types', () => {
    const result = emit('/src/dist', [
      {
        name: 'Service',
        path: '/service.ts',
        methods: [
          {
            name: 'foo',
            arguments: [],
            returnType: {
              name: 'Foo',
              path: '/src/interfaces/foo.ts',
              params: [
                {
                  name: '{ id: Bar }',
                  path: '',
                  nested: [
                    {
                      name: 'Bar',
                      path: '/src/interfaces/bar.ts'
                    }
                  ]
                }
              ]
            },
            sideEffect: true
          }
        ]
      }
    ]);

    expect(result).toBe(
      `import {Service as Service1} from '../../service';
import {Injectable, Inject} from '@angular/core';
import {grpcUnary, FetchFn, Fetch, Host} from 'ts-rpc';
import {Bar} from '../interfaces/bar';
import {Foo} from '../interfaces/foo';

@Injectable()
export class Service implements Service1 {
  private c: <T>(sideEffect: boolean, method: string, ...args: any[]) => Promise<T>;
  constructor(@Inject(Fetch) fetch: FetchFn, @Inject(Host) host: string) {
    this.c = grpcUnary.bind(null, fetch, host, 'Service');
  }
  foo(): Promise<Foo<{ id: Bar }>> {
    return this.c<Foo<{ id: Bar }>>(true, 'foo');
  }
}`
    );
  });

  it('should not emit imports to TypeScript built-in types', () => {
    const result = emit('/src/dist', [
      {
        name: 'Service',
        path: '/service.ts',
        methods: [
          {
            name: 'foo',
            arguments: [],
            returnType: {
              name: 'Foo',
              path: '/src/interfaces/foo.ts',
              params: [
                {
                  name: 'Partial',
                  path: 'typescript/lib',
                  params: [
                    {
                      name: 'Bar',
                      path: '/src/interfaces/bar.ts'
                    }
                  ]
                }
              ]
            },
            sideEffect: true
          }
        ]
      }
    ]);

    expect(result).toBe(
      `import {Service as Service1} from '../../service';
import {Injectable, Inject} from '@angular/core';
import {grpcUnary, FetchFn, Fetch, Host} from 'ts-rpc';
import {Bar} from '../interfaces/bar';
import {Foo} from '../interfaces/foo';

@Injectable()
export class Service implements Service1 {
  private c: <T>(sideEffect: boolean, method: string, ...args: any[]) => Promise<T>;
  constructor(@Inject(Fetch) fetch: FetchFn, @Inject(Host) host: string) {
    this.c = grpcUnary.bind(null, fetch, host, 'Service');
  }
  foo(): Promise<Foo<Partial<Bar>>> {
    return this.c<Foo<Partial<Bar>>>(true, 'foo');
  }
}`
    );
  });
});
