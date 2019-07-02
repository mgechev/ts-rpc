import { emitType, ImportMap, emit } from '../emitter';

describe('emitType', () => {
  let imports: ImportMap;
  beforeEach(() => {
    imports = {
      symbols: new Map(),
      imports: new Map()
    };
  });

  it('should emit simple built-in types', () => {
    expect(
      emitType(imports, {
        name: 'Promise',
        path: ''
      })
    ).toEqual('Promise');
  });

  it('should emit simple types', () => {
    expect(
      emitType(imports, {
        name: 'Foo',
        path: '/path.ts'
      })
    ).toEqual('Foo');
  });

  it('should emit generic types', () => {
    expect(
      emitType(imports, {
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
      emitType(imports, {
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
      `import {Foo} from './foo';

export class Service {
  foo(): Promise<Foo> {
    //
  }
}`
    );
  });

  it('should serialize single service with multiple methods and arguments', () => {
    const result = emit('/', [
      {
        name: 'Service',
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
      `import {Bar} from './bar';
import {Foo} from './foo';
import {Qux, Foo as Foo1} from './foo2';

export class Service {
  foo(map: Map<string, Bar>): Promise<Foo> {
    //
  }
  bar(qux: Qux, foo: Foo1): Promise<Bar> {
    //
  }
}`
    );
  });

  it('should handle relative paths', () => {
    const result = emit('/src/dist', [
      {
        name: 'Service',
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
      `import {Foo} from '../interfaces/foo';

export class Service {
  foo(): Promise<Foo> {
    //
  }
}`
    );
  });

  it('should throw on non-absolute path', () => {
    expect(() => emit('../', [])).toThrow();
  });
});
