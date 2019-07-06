import { parse } from '../parser';
import { createMemoryProgram } from '../program/program';

const tsrpc: [string, string] = [
  '/node_modules/ts-rpc.ts',
  `
  export interface Service {}
  `
];

describe('parser', () => {
  it('should not throw', () => {
    const program = createMemoryProgram(
      new Map([
        tsrpc,
        [
          '/foo.ts',
          `
            import {Service} from 'ts-rpc';
            interface Bar extends Service {}
          `
        ]
      ])
    );
    expect(() => parse(program)).not.toThrow();
  });

  it('should find the service name', () => {
    const program = createMemoryProgram(
      new Map([
        tsrpc,
        [
          '/foo.ts',
          `
            import {Service as Sample} from 'ts-rpc';
            interface Bar extends Sample {}
          `
        ]
      ])
    );
    const { services: result } = parse(program);
    expect(result.length).toBe(1);
    expect(result[0].name).toBe('Bar');
  });

  it('should find the service name with indirect imports', () => {
    const program = createMemoryProgram(
      new Map([
        tsrpc,
        ['/bar.ts', 'export {Service as bar} from "ts-rpc";'],
        [
          '/foo.ts',
          `
            import {bar as foo} from './bar';
            interface Bar extends foo {}
          `
        ]
      ])
    );
    const { services: result } = parse(program);
    expect(result.length).toBe(1);
    expect(result[0].name).toBe('Bar');
  });

  it("should read service's method names", () => {
    const program = createMemoryProgram(
      new Map([
        tsrpc,
        ['/bar.ts', 'export {Service as bar} from "ts-rpc";'],
        [
          '/foo.ts',
          `
            import {bar as foo} from './bar';
            interface Bar extends foo {
              foo(): Promise<void>;
              baz(): Promise<void>;
            }
          `
        ]
      ])
    );
    const { services: result } = parse(program);
    expect(result.length).toBe(1);
    expect(result[0].name).toBe('Bar');
    expect(result[0].methods[0].name).toBe('foo');
    expect(result[0].methods[1].name).toBe('baz');
    expect(result[0].methods[0].arguments.length).toBe(0);
  });

  it("should read service's method types", () => {
    const program = createMemoryProgram(
      new Map([
        tsrpc,
        ['/bar.ts', 'export {Service as bar} from "ts-rpc";'],
        [
          '/foo.ts',
          `
            import {bar as foo} from './bar';
            interface Human {}
            interface Bar extends foo {
              foo(): Promise<void>;
              baz(): Promise<Human>;
            }
          `
        ]
      ])
    );
    const { services: result } = parse(program);
    expect(result.length).toBe(1);
    expect(result[0].name).toBe('Bar');
    expect(result[0].methods[0].returnType.name).toBe('void');
    expect(result[0].methods[1].returnType).toEqual({
      name: 'Human',
      path: '/foo.ts'
    });
  });

  it("should read service's method effects", () => {
    const program = createMemoryProgram(
      new Map([
        tsrpc,
        [
          '/foo.ts',
          `
            import {Service} from 'ts-rpc';

            interface Human {}
            interface Bar extends Service {
              foo<Mutate>(): Promise<void>;
              baz<Read>(): Promise<Human>;
            }
          `
        ]
      ])
    );
    const { services: result } = parse(program);
    expect(result.length).toBe(1);
    expect(result[0].path).toBe('/foo.ts');
    expect(result[0].name).toBe('Bar');
    expect(result[0].methods[0].returnType.name).toBe('void');
    expect(result[0].methods[0].sideEffect).toBe(true);
    expect(result[0].methods[1].returnType.name).toBe('Human');
    expect(result[0].methods[1].returnType.path).toBe('/foo.ts');
    expect(result[0].methods[1].sideEffect).toBe(false);
  });

  it("should read service's method parameters", () => {
    const program = createMemoryProgram(
      new Map([
        tsrpc,
        ['/bar.ts', 'export type foo = never;'],
        [
          '/foo.ts',
          `
            import {Service} from 'ts-rpc';
            import {foo} from './bar';

            interface Human {}
            interface Bar extends Service {
              foo<Mutate>(a: number, b: foo): Promise<void>;
            }
          `
        ]
      ])
    );
    const { services: result } = parse(program);
    expect(result.length).toBe(1);
    expect(result[0].name).toBe('Bar');
    expect(result[0].path).toBe('/foo.ts');
    expect(result[0].methods[0].arguments[0].name).toBe('a');
    expect(result[0].methods[0].arguments[0].type.name).toBe('number');
    expect(result[0].methods[0].arguments[1].type.name).toBe('never');
  });

  it("should read service's method type when built of polymorphic types", () => {
    const program = createMemoryProgram(
      new Map([
        tsrpc,
        [
          '/bar.ts',
          `
          export type Foo<T> = T | T[];
          export type Bar<T, R> = T | R[];
          `
        ],
        [
          '/foo.ts',
          `
            import {Service} from 'ts-rpc';
            import {Foo, Bar} from './bar';

            interface Qux {}
            interface FooBar {}

            interface Human {}
            interface RPC extends Service {
              foo<Mutate>(a: number, b: foo): Promise<Foo<Bar<Qux, FooBar>>>;
            }
          `
        ]
      ])
    );
    const { services: result } = parse(program);
    expect(result.length).toBe(1);
    expect(result[0].name).toBe('RPC');
    expect(result[0].path).toBe('/foo.ts');
    const { returnType } = result[0].methods[0];
    expect(returnType.name).toBe('Foo');
    expect(returnType.path).toBe('/bar.ts');
    expect(returnType.params!.length).toBe(1);
    const params = returnType.params as any;
    expect(params[0].name).toBe('Bar');
    expect(params[0].path).toBe('/bar.ts');
    expect(params[0].params.length).toBe(2);
    expect(params[0].params[0].name).toBe('Qux');
    expect(params[0].params[0].path).toBe('/foo.ts');
    expect(params[0].params[1].name).toBe('FooBar');
    expect(params[0].params[1].path).toBe('/foo.ts');
  });

  it("should read service's method parameters when built of polymorphic types", () => {
    const program = createMemoryProgram(
      new Map([
        tsrpc,
        [
          '/bar.ts',
          `
          export type Foo<T> = T | T[];
          export type Bar<T, R> = T | R[];
          `
        ],
        [
          '/foo.ts',
          `
            import {Service} from 'ts-rpc';
            import {Foo, Bar} from './bar';

            interface Qux {}
            interface FooBar {}

            interface Human {}
            interface RPC extends Service {
              foo<Mutate>(a: Foo<Bar<Qux, FooBar>>, b: foo): Promise<void>;
            }
          `
        ]
      ])
    );
    const { services: result } = parse(program);
    expect(result.length).toBe(1);
    expect(result[0].name).toBe('RPC');
    const { returnType } = result[0].methods[0];
    const args = result[0].methods[0].arguments;
    expect(returnType.name).toBe('void');
    const params = args[0].type.params as any;
    expect(params[0].name).toBe('Bar');
    expect(params[0].path).toBe('/bar.ts');
    expect(params[0].params.length).toBe(2);
    expect(params[0].params[0].name).toBe('Qux');
    expect(params[0].params[0].path).toBe('/foo.ts');
    expect(params[0].params[1].name).toBe('FooBar');
    expect(params[0].params[1].path).toBe('/foo.ts');
  });

  it('should not allow generic services', () => {
    const program = createMemoryProgram(
      new Map([
        tsrpc,
        [
          '/bar.ts',
          `
          export type Foo<T> = T | T[];
          export type Bar<T, R> = T | R[];
          `
        ],
        [
          '/foo.ts',
          `
            import {Service} from 'ts-rpc';
            import {Foo, Bar} from './bar';

            interface Qux {}
            interface FooBar {}

            interface Human {}
            interface RPC<T> extends Service {
              foo<Mutate>(a: Foo<Bar<Qux, FooBar>>, b: foo): Promise<void>;
            }
          `
        ]
      ])
    );
    const { services: result } = parse(program);
    expect(result.length).toBe(0);
  });
});
