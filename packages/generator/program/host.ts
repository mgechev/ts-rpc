import * as ts from 'typescript';
import { join, dirname } from 'path';

const defaultLib = 'lib.d.ts';
const defaultLibLocation = join(dirname(require.resolve('typescript')), defaultLib);

export const createMemoryHost = (files: Map<string, string>) => {
  files.set(defaultLib, defaultLibLocation);

  const host: ts.CompilerHost = {
    getSourceFile(fileName: string, languageVersion: ts.ScriptTarget): ts.SourceFile | undefined {
      const content = files.get(fileName);
      if (!content) return undefined;
      return ts.createSourceFile(fileName, content, languageVersion);
    },
    fileExists(fileName: string) {
      if (fileName === '/node_modules/ts-rpc.ts') {
        return true;
      }
      return files.has(fileName);
    },
    readFile(fileName: string) {
      return files.get(fileName);
    },
    getDefaultLibFileName(options: ts.CompilerOptions): string {
      return defaultLib;
    },
    writeFile(name: string, content: string, _: boolean) {
      files.set(name, content);
    },
    getCurrentDirectory(): string {
      return '/';
    },
    getCanonicalFileName(fileName: string): string {
      return fileName;
    },
    useCaseSensitiveFileNames(): boolean {
      return true;
    },
    getNewLine(): string {
      return '\n';
    },
    getDefaultLibLocation(): string {
      return defaultLibLocation;
    },
    getSourceFileByPath(
      fileName: string,
      path: ts.Path,
      languageVersion: ts.ScriptTarget
    ): ts.SourceFile | undefined {
      const filePath = join(fileName, path);
      if (!files.has(filePath)) return undefined;
      return ts.createSourceFile(filePath, files.get(filePath) as string, languageVersion);
    },
    getCancellationToken(): ts.CancellationToken {
      return {
        isCancellationRequested() {
          return false;
        },
        throwIfCancellationRequested() {
          throw new Error('Cancellation requested');
        }
      };
    }
  };
  return host;
};
