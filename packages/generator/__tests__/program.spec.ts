import * as ts from 'typescript';
import { createMemoryProgram } from '../program/program';

describe('createMemoryProgram', () => {
  it('should not throw', () => {
    expect(() => createMemoryProgram(new Map([['/foo.ts', 'class Bar {}']]))).not.toThrow();
  });

  it('should get file AST', () => {
    const program = createMemoryProgram(new Map([['/foo.ts', 'class Bar {}']]));
    const sourceFile = program.getSourceFile('/foo.ts');
    expect(sourceFile).toBeDefined();
    let foundClass = false;
    sourceFile!.forEachChild(n => {
      if (
        n.kind === ts.SyntaxKind.ClassDeclaration &&
        (n as ts.ClassDeclaration).name!.text === 'Bar'
      ) {
        foundClass = true;
      }
    });
    expect(foundClass).toBeTruthy();
  });
});
