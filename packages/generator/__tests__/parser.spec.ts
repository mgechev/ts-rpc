import { parse } from '../parser';
import { createMemoryProgram } from '../program/program';

describe('parser', () => {
  it('should not throw', () => {
    const program = createMemoryProgram(
      new Map([
        [
          '/node_modules/ts-rpc.ts',
          `
          export interface Service {}
          `
        ],
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
        [
          '/node_modules/ts-rpc.ts',
          `
          export interface Service {}
          `
        ],
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
        [
          '/node_modules/ts-rpc.ts',
          `
          export interface Service {}
          `
        ],
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
});
