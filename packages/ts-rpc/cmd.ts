import * as ts from 'typescript';
import { dirname, resolve, isAbsolute, join } from 'path';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { parse } from './parser';
import { emit } from './emitter';
import { sync as mkdirpSync } from 'mkdirp';

const createProgram = (tsconfig: string) => {
  const config = ts.readConfigFile(tsconfig, ts.sys.readFile);
  const projectDirectory: string = dirname(tsconfig);
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

const report = (diagnostic: ts.Diagnostic[]) => {
  console.error(diagnostic.length, 'errors');
};

export const generate = (tsconfig: string, out: string) => {
  if (!isAbsolute(out)) {
    out = join(process.cwd(), out);
  }
  const program = createProgram(tsconfig);
  const { services, diagnostic } = parse(program);
  if (diagnostic.length) {
    report(diagnostic);
    process.exit(1);
  }
  if (!services.length) {
    console.warn('No service declarations found');
  }
  emit(out, services).forEach(({ path, content }) => {
    mkdirpSync(dirname(path));
    writeFileSync(path, content);
  });
};
