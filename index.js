const { table } = require('table');
const fs = require('fs');
const _ = require('lodash');
const GenerateCSV = require('./generateCSV');
const moment = require('moment');
const config = require('./config');
const axios = require('axios').default;
const Promise = require('bluebird');
const { createInterface } = require('readline');

class PortfolioManager {
  constructor (args) {
    this.isDebug = args.v;
  }

  async run (args) {
    if (args.g !== undefined) {
      const filepath = args.g;
      if (_.isString(filepath) && filepath) {
        return new GenerateCSV().run(filepath);
      }
      throw new Error('filepath missing');
    }

    let { token } = args;
    token = token === true ? undefined : token;
    let { date } = args;
    date = date === true ? undefined : date;

    let data = {};
    if (args.f !== undefined) {
      const filepath = args.f;
      try {
        if (_.isString(filepath) && filepath) {
          data = await this.loadCSV(filepath, token, date);
        } else {
          data = await this.loadCSV('./data.csv', token, date);
        }
      } catch (e) {
        this.debug(e);
      }
    }

    const tableData = await this.getValue(data, date);
    tableData.unshift(['TOKEN', 'AMOUNT', 'VALUATION (USD)', 'DATE']);
    console.log(table(tableData));
  }

  debug () {
    if (this.isDebug) {
      console.log(...arguments);
    }
  }

  async loadCSV (filepath, token, date) {
    const fileStream = fs.createReadStream(filepath, { highWaterMark: 256 * 1024 });

    const rl = createInterface({
      input: fileStream,
      crlfDelay: Infinity
    });

    const result = {};

    console.log('started', moment().format());
    const tsDate = date ? moment(date).unix() : undefined;
    for await (const line of rl) {
      // Each line in input.txt will be successively available here as `line`.
      const arr = _.split(line, ',');
      const data = {
        timestamp: parseInt(arr[0]),
        transaction_type: arr[1],
        token: arr[2],
        amount: arr[1] === 'DEPOSIT' ? parseFloat(arr[3]) : -parseFloat(arr[3])
      };

      if (token && data.token !== token) {
        continue;
      }
      if (tsDate && tsDate < data.date) {
        continue;
      }

      result[data.token] = (result[data.token] || 0) + data.amount;
    }
    console.log('done', moment().format());
    console.log(result);
    return result;

    // .pipe(csv.parse({ headers: true }))
    // .on('data', (data) => {
    //   // this.transactions.insert({
    //   //   ...data,
    //   //   timestamp: parseInt(data.timestamp),
    //   //   amount: data.transaction_type === 'DEPOSIT' ? parseFloat(data.amount) : -parseFloat(data.amount)
    //   // });
    // })
    // .on('end', () => {
    //   console.log('done', moment().format());
    //   resolve();
    // })
    // .on('error', (e) => {
    //   reject(e);
    // });
  }

  getExchangeRates (symbol, timestamp) {
    return axios.get(`https://min-api.cryptocompare.com/data/pricehistorical?fsym=${symbol}&tsyms=USD&ts=${timestamp}`, {
      headers: {
        authorization: 'Apikey ' + config.cryptocompare_key
      }
    })
      .then(({ data }) => {
        return data;
      })
      .catch((error) => {
        this.debug(error);
      });
  }

  async getValue (data, date) {
    const result = data;

    const promiseArr = [];
    const timestamp = date ? moment(date).unix() : moment().unix();
    _.each(result, (value, key) => {
      promiseArr.push(this.getExchangeRates(key, timestamp));
    });

    return Promise.all(promiseArr).then((exchangeRateResult) => {
      const exchangeRates = _.merge({}, ...exchangeRateResult);
      const convertedResult = [];
      _.each(result, (value, key) => {
        const convertedValue = value * exchangeRates[key].USD;
        convertedResult.push([key, value, convertedValue, moment.unix(timestamp).format('YYYY-MM-DD')]);
      });
      return convertedResult;
    });
  }
}

module.exports = PortfolioManager;
