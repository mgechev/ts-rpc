import * as ts from 'typescript';
import { dirname, resolve, join } from 'path';
import { existsSync, readFileSync } from 'fs';

const defaultLib = 'lib.d.ts';
const defaultLibLocation = join(dirname(require.resolve('typescript')), defaultLib);
const createMemoryHost = (files: Map<string, string>) => {
  files.set(defaultLib, defaultLibLocation);

  const host: ts.CompilerHost = {
    getSourceFile(fileName: string, languageVersion: ts.ScriptTarget): ts.SourceFile | undefined {
      const content = files.get(fileName);
      if (!content) return undefined;
      return ts.createSourceFile(fileName, content, languageVersion);
    },
    fileExists(fileName: string) {
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
    // resolveModuleNames?(
    //   moduleNames: string[],
    //   containingFile: string,
    //   reusedNames?: string[],
    //   redirectedReference?: ResolvedProjectReference
    // ): (ResolvedModule | undefined)[] {},
    // readDirectory?(
    //   rootDir: string,
    //   extensions: ReadonlyArray<string>,
    //   excludes: ReadonlyArray<string> | undefined,
    //   includes: ReadonlyArray<string>,
    //   depth?: number
    // ): string[] {},
    // resolveTypeReferenceDirectives?(
    //   typeReferenceDirectiveNames: string[],
    //   containingFile: string,
    //   redirectedReference?: ResolvedProjectReference
    // ): (ResolvedTypeReferenceDirective | undefined)[] {},
    // getEnvironmentVariable?(name: string): string | undefined {},
    // createHash?(data: string): string {},
    // getParsedCommandLine?(fileName: string): ParsedCommandLine | undefined {}
  };
  return host;
};

export const createMemoryProgram = (files: Map<string, string>) => {
  const options: ts.CompilerOptions = {};
  const program = ts.createProgram([...files.keys()], options, createMemoryHost(files));
  return program;
};

export const createProgram = (tsconfigFile: string) => {
  const config = ts.readConfigFile(tsconfigFile, ts.sys.readFile);
  const projectDirectory: string = dirname(tsconfigFile);
  const parseConfigHost: ts.ParseConfigHost = {
    fileExists: existsSync,
    readDirectory: ts.sys.readDirectory,
    readFile: file => readFileSync(file, 'utf8'),
    useCaseSensitiveFileNames: true
  };
  const parsed = ts.parseJsonConfigFileContent(
    config.config,
    parseConfigHost,
    resolve(projectDirectory),
    { noEmit: true }
  );

  if (config.error !== undefined) {
    throw new Error(config.error.messageText.toString());
  }

  const host = ts.createCompilerHost(parsed.options, true);
  const program = ts.createProgram(parsed.fileNames, parsed.options, host);
  return program;
};

const parseFile = (content: string, program: ts.Program) => {};

export const parse = (program: ts.Program) => {};
