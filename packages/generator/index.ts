import * as cmd from 'commander';

cmd
  .version(require('./package.json').version)
  .usage('ts-rpc-gen [tsconfig.json] --output [client output directory]')
  .option('-o --output [path]', 'Path of the client')
  .parse(process.argv);

console.log(cmd.output);
