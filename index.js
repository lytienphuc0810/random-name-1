const { table } = require('table');
const fs = require('fs');
const _ = require('lodash');
const GenerateCSV = require('./generateCSV');
const moment = require('moment');
const config = require('./config');
const axios = require('axios').default;
const Promise = require('bluebird');
const Loki = require('lokijs');
const csv = require('fast-csv');
const { createInterface } = require('readline');

class PortfolioManager {
  constructor (args) {
    this.db = new Loki('transactions.db');
    this.transactions = this.db.addCollection('transactions');
    this.transactions.ensureIndex('token', true);
    this.transactions.ensureIndex('timestamp', true);
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

    if (args.f !== undefined) {
      const filepath = args.f;
      try {
        if (_.isString(filepath) && filepath) {
          await this.loadCSV(filepath);
        } else {
          await this.loadCSV('./data.csv');
        }
      } catch (e) {
        this.debug(e);
      }
    }

    // if (this.transactions.count() > 0) {
    //   let { token } = args;
    //   token = token === true ? undefined : token;
    //   let { date } = args;
    //   date = date === true ? undefined : date;
    //
    //   const tableData = await this.getValue({ date, token });
    //   tableData.unshift(['TOKEN', 'AMOUNT', 'VALUATION (USD)', 'DATE']);
    //   console.log(table(tableData));
    // }
  }

  debug () {
    if (this.isDebug) {
      console.log(...arguments);
    }
  }

  loadCSV (filepath) {
    return new Promise(async (resolve, reject) => {
      const fileStream = fs.createReadStream(filepath, { highWaterMark: 256 * 1024 });

      const rl = createInterface({
        input: fileStream,
        crlfDelay: Infinity
      });

      console.log('started', moment().format());
      for await (const line of rl) {
        // Each line in input.txt will be successively available here as `line`.
        // console.log(`Line from file: ${line}`);
      }
      console.log('done', moment().format());

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
    });
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

  async getValue ({ date, token }) {
    const result = {};

    const query = {};
    if (token) {
      query.token = { $eq: token };
    }
    if (date) {
      const mParamTs = moment(date).endOf('d').unix();
      query.timestamp = { $lte: mParamTs };
    }

    const records = this.transactions.chain()
      .find(query)
      .data();

    _.each(records, record => {
      if (result[record.token] === undefined) {
        result[record.token] = 0;
      }
      result[record.token] += record.amount;
    });

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
