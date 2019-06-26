import * as ts from 'typescript';

import { createMemoryHost } from './host';
import { dirname, resolve } from 'path';
import { existsSync, readFileSync } from 'fs';

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
