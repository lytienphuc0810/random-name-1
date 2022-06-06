#! /usr/bin/env node

const yargs = require('yargs');
const PortfolioManager = require('../index');

const usage = '\nUsage: tokenquote -f <csv_filepath>';
const options = yargs
  .usage(usage)
  .option('l', {
    alias: 'languages',
    describe: 'List all supported languages.',
    type: 'boolean',
    demandOption: false
  })
  .option('v', {
    describe: 'Display logs',
    type: 'boolean',
    demandOption: false
  })
  .option('f', {
    describe: 'Pass the csv file to be parsed',
    type: 'string',
    demandOption: true
  })
  .option('token', {
    describe: 'Pass token to show only transactions associate with this token',
    type: 'string',
    demandOption: false
  })
  .option('date', {
    describe: 'Pass date to show only transactions before or equal this date',
    type: 'string',
    demandOption: false
  })
  .help(true)
  .argv;

new PortfolioManager(yargs.argv).run(yargs.argv);
