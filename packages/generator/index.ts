import * as cmd from 'commander';
import { generate } from './cmd';

cmd
  .version(require('./package.json').version)
  .usage('ts-rpc-gen [path to tsconfig.json] --output [client output directory]')
  .option('-o --output [path]', 'Path of the client')
  .parse(process.argv);

if (cmd.args.length !== 1) {
  console.error('You must specify path to the project tsconfig.json as an argument');
  process.exit(1);
}

generate(cmd.args[0], cmd.output);
