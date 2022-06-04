const _ = require('lodash');
const moment = require('moment');
const fs = require('fs');

const mockSymbols = [
  'BTC',
  'ETH',
  'USDT',
  'USDC',
  'BNB',
  'ADA',
  'XRP',
  'BUSD',
  'SOL',
  'DOGE',
  'DOT',
  'WBTC',
  'TRX',
  'DAI',
  'AVAX',
  'SHIB',
  'MATIC',
  'LEO',
  'CRO',
  'LTC',
];

const csv = _.map(_.range(1, 10000), () => (
  [
    moment().unix(),
    ['DEPOSIT', 'WITHDRAWAL'][_.random(0, 1)],
    mockSymbols[_.random(0, 19)],
    _.random(0.000001, 1),
  ]
));
csv.unshift([
  'timestamp',
  'transaction_type',
  'token',
  'amount',
]);

class GenerateCSV {
  writeCSV(data, filepath) {
    const stream = fs.createWriteStream(filepath, {
    });

    _.each(data, (d) => {
      stream.write(`${_.join(d, ',')}\n`); // append string to your file
    });
    stream.end();
  }

  run(filepath = './data.csv') {
    return this.writeCSV(csv, filepath);
  }
}

module.exports = GenerateCSV;
