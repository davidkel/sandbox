import * as os from 'os';
import * as yargs from 'yargs';
import {CDS} from './CDS';

const cmds = () => {
  return yargs
    .command('build', 'Build the .cds file', (yargsInstance: any) => {
      yargsInstance.option('source', {
        alias: 's',
        describe: 'The location of the root project',
        required: true
      });
      yargsInstance.option('destination', {
        alias: 'd',
        describe: 'The destination of the .cds file',
        required: true
      });
      yargsInstance.option('contractName', {
        alias: 'n',
        describe: 'The contract name',
        required: true
      });
      yargsInstance.option('invokeHandler', {
        alias: 'i',
        describe: 'Should the invoke handler be used',
        required: false,
        type: 'boolean'
      });
      yargsInstance.option('contractVersion', {
        alias: 'c',
        describe: 'The package verison to be set',
        required: false
      });
    })
    .help('h')
    .argv;
};

const main = async () => {
  const temporaryDirectory: string = os.tmpdir();
  const now: number = Date.now();
  const contractTemporaryDirectory: string = `${temporaryDirectory}/wet-contract-${now}/`;
  const argv: any = await cmds();

  const cds = new CDS(contractTemporaryDirectory, argv);
  await cds.build();
};

main().catch((err) => {
  console.log(err.stack);

  process.exit(1);
});
