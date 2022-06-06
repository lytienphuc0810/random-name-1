const { table } = require('table');
const fs = require('fs');
const _ = require('lodash');
const moment = require('moment');
const config = require('./config');
const axios = require('axios').default;
const Promise = require('bluebird');
const { createInterface } = require('node:readline');
const {
  Worker
} = require('node:worker_threads');
const path = require('path');

class PortfolioManager {
  LINES_COUNT_FOR_WORKER = 5000000;

  constructor (args) {
    this.isDebug = args.v;
  }

  async run (args) {
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
    function invokeWorker (workerPromises, lines, tsDate) {
      workerPromises.push(new Promise((resolve, reject) => {
        const worker = new Worker(path.resolve(__dirname, 'processLines.js'), { workerData: { lines, tsDate, token } });
        worker.once('message', (message) => {
          resolve(message);
        });
      }));
    }

    return new Promise((resolve, reject) => {
      const rl = createInterface({
        input: fs.createReadStream(filepath),
        crlfDelay: Infinity
      });

      const tsDate = date ? moment(date).endOf('d').unix() : undefined;

      const workerPromises = [];
      let lines = [];
      let isFirstLineSkip = false;

      rl.on('line', (line) => {
        if (!isFirstLineSkip) {
          isFirstLineSkip = true;
          return;
        }

        if (lines.length < this.LINES_COUNT_FOR_WORKER) {
          lines.push(line);
        } else {
          invokeWorker(workerPromises, lines, tsDate);
          lines = [line];
        }
      });

      rl.on('close', () => {
        invokeWorker(workerPromises, lines, tsDate);
        lines = [];

        Promise.all(workerPromises).then(
          (workerResults) => {
            const result = {};
            _.each(workerResults, r => {
              _.each(r, (value, key) => {
                if (result[key] === undefined) {
                  result[key] = r[key];
                } else {
                  result[key] += r[key];
                }
              });
            });
            resolve(result);
          }
        );
      });

      rl.on('error', (e) => { reject(e); });
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
