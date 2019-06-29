import * as ts from 'typescript';
import { join, dirname } from 'path';
import { readFileSync, readdirSync, statSync } from 'fs';

const defaultLibName = 'lib.d.ts';
const defaultLibPath = dirname(require.resolve('typescript'));
const defaultLibLocation = join(defaultLibPath, defaultLibName);

const defaultLib = readFileSync(defaultLibLocation).toString();

export const createMemoryHost = (files: Map<string, string>) => {
  readdirSync(defaultLibPath).forEach(path => {
    path = join(defaultLibPath, path);
    if (statSync(path).isFile()) {
      files.set(path, readFileSync(path).toString())
    }
  });
  files.set(defaultLibName, defaultLib);

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
    getDefaultLibFileName(_: ts.CompilerOptions): string {
      return defaultLibName;
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
      return defaultLibPath;
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
