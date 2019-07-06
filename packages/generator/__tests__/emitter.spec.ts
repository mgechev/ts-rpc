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
            sideEffect: true
          }
        ]
      }
    ]);

    expect(result).toBe(
      `import {Service as Service1} from './service';
import {Injectable, Inject} from '@angular/core';
import {grpcUnary, FetchFn, Fetch} from 'ts-rpc';
import {Foo} from './foo';

@Injectable()
export class Service implements Service1 {
  constructor(@Inject(Fetch) fetch: FetchFn) {
    this.c = grpcUnary.bind(null, fetch, 'Service');
  }
  foo(): Promise<Foo> {
    this.c('foo');
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
import {grpcUnary, FetchFn, Fetch} from 'ts-rpc';
import {Bar} from './bar';
import {Foo} from './foo';
import {Qux, Foo as Foo1} from './foo2';

@Injectable()
export class Service implements Service1 {
  constructor(@Inject(Fetch) fetch: FetchFn) {
    this.c = grpcUnary.bind(null, fetch, 'Service');
  }
  foo(map: Map<string, Bar>): Promise<Foo> {
    this.c('foo', map);
  }
  bar(qux: Qux, foo: Foo1): Promise<Bar> {
    this.c('bar', qux, foo);
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
import {grpcUnary, FetchFn, Fetch} from 'ts-rpc';
import {Foo} from '../interfaces/foo';

@Injectable()
export class Service implements Service1 {
  constructor(@Inject(Fetch) fetch: FetchFn) {
    this.c = grpcUnary.bind(null, fetch, 'Service');
  }
  foo(): Promise<Foo> {
    this.c('foo');
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
import {grpcUnary, FetchFn, Fetch} from 'ts-rpc';
import {Injectable as Injectable1, grpcUnary as grpcUnary1} from '../../foo';
import {Inject as Inject1} from '../interfaces/foo';

@Injectable()
export class Service implements Service1 {
  constructor(@Inject(Fetch) fetch: FetchFn) {
    this.c = grpcUnary.bind(null, fetch, 'Service');
  }
  foo(a: Injectable1, b: grpcUnary1): Promise<Inject1> {
    this.c('foo', a, b);
  }
}`
    );
  });
});
