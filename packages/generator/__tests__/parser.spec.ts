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
    const result = parse(program);
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
    const result = parse(program);
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
    const result = parse(program);
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
    const result = parse(program);
    expect(result.length).toBe(1);
    expect(result[0].name).toBe('Bar');
    expect(result[0].methods[0].returnType.name).toBe('void');
    expect(result[0].methods[1].returnType).toEqual({
      name: 'Human',
      path: '/foo.ts'
    });
  });

  it("should read service's method types", () => {
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
    const result = parse(program);
    expect(result.length).toBe(1);
    expect(result[0].name).toBe('Bar');
    expect(result[0].methods[0].returnType.name).toBe('void');
    expect(result[0].methods[0].sideEffect).toBe(true);
    expect(result[0].methods[1].returnType.name).toBe('Human');
    expect(result[0].methods[1].returnType.path).toBe('/foo.ts');
    expect(result[0].methods[1].sideEffect).toBe(false);
  });

  it("should read service's method types", () => {
    const program = createMemoryProgram(
      new Map([
        tsrpc,
        [
          '/bar.ts',
          'export type foo = never;'
        ],
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
    const result = parse(program);
    expect(result.length).toBe(1);
    expect(result[0].name).toBe('Bar');
    expect(result[0].methods[0].arguments[0].name).toBe('a');
    expect(result[0].methods[0].arguments[0].type.name).toBe('number');
    expect(result[0].methods[0].arguments[1].type.name).toBe('never');
  });
});
