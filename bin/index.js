#! /usr/bin/env node

const yargs = require('yargs');
const { hideBin } = require('yargs/helpers');

const { argv } = yargs(hideBin(process.argv));

const PortfolioManager = require('../index');

const usage = '\nUsage: tran <lang_name> sentence to be translated';

yargs
  .usage(usage)
  .option('l', {
    alias: 'languages',
    describe: 'List all supported languages.',
    type: 'boolean',
    demandOption: false
  }).help(true)
  .argv;

new PortfolioManager(argv).run(argv);
