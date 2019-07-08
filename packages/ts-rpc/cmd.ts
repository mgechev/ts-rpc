import * as ts from 'typescript';
import { dirname, resolve, isAbsolute, join } from 'path';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { parse } from './parser';
import { emit } from './emitter';
import { sync as mkdirpSync } from 'mkdirp';
import chalk from 'chalk';

const error = (str: string) => console.error('🚨', chalk.red(str));
const warning = (str: string) => console.warn('⚠️', chalk.yellow(str));
const info = (str: string) => console.log('ℹ️ ', chalk.blueBright(str));
const success = (str: string) => console.log('✅', chalk.green(str));

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
    error(config.error.messageText.toString());
    process.exit(1);
  }

  const host = ts.createCompilerHost(parsed.options, true);
  const program = ts.createProgram(parsed.fileNames, parsed.options, host);

  return program;
};

const report = (diagnostic: ts.Diagnostic[]) => {
  diagnostic.forEach(d => error(d.messageText.toString()));
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
    warning('No service declarations found');
  }
  const clients = emit(out, services)
  clients.forEach(({ path, content }) => {
    info(`Emitting ${path.replace(process.cwd(), '')}`);
    mkdirpSync(dirname(path));
    writeFileSync(path, content);
  });
  clients.length && success(`Created ${clients.length} ${clients.length === 1 ? 'client': 'clients'}`);
};
