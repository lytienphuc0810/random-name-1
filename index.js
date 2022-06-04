const { table } = require('table');
const csv = require('csv-parser');
const fs = require('fs');
const _ = require('lodash');
const GenerateCSV = require('./generateCSV');
const moment = require('moment');
const config = require('./config');
const axios = require('axios').default;
const Promise = require('bluebird');

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

    let data = [];
    if (args.f !== undefined) {
      const filepath = args.f;
      try {
        if (_.isString(filepath) && filepath) {
          data = await this.loadCSV(filepath);
        } else {
          data = await this.loadCSV('./data.csv');
        }
      } catch (e) {
        this.debug(e);
      }
    }

    if (data.length > 0) {
      let { token } = args;
      token = token === true ? undefined : token;
      let { date } = args;
      date = date === true ? undefined : date;

      const tableData = await this.getValue({ date, token }, data);
      tableData.unshift(['TOKEN', 'AMOUNT', 'VALUATION (USD)', 'DATE']);
      console.log(table(tableData));
    }
  }

  debug () {
    if (this.isDebug) {
      console.log(...arguments);
    }
  }

  loadCSV (filepath) {
    const results = [];
    return new Promise((resolve, reject) => {
      fs.createReadStream(filepath)
        .pipe(csv())
        .on('data', (data) => {
          results.push({
            ...data,
            timestamp: parseInt(data.timestamp),
            amount: parseFloat(data.amount)
          });
        })
        .on('end', () => {
          resolve(results);
        })
        .on('error', (e) => {
          reject(e);
        });
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

  async getValue ({ date, token }, data) {
    let result = {};
    _.each(data, record => {
      if (result[record.token] === undefined) {
        result[record.token] = 0;
      }

      const calculateCurrentPosition = () => {
        if (record.transaction_type === 'WITHDRAWAL') {
          result[record.token] -= record.amount;
        } else {
          result[record.token] += record.amount;
        }
      };

      if (date) {
        const mParamDate = moment(date);
        const mDate = moment.unix(record.timestamp);
        if (mDate.isSameOrBefore(mParamDate, 'd')) {
          calculateCurrentPosition();
        }
      } else {
        calculateCurrentPosition();
      }
    });

    if (token) {
      result = _.pick(result, token);
    }

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
