const { table } = require('table');
const csv = require('csv-parser');
const fs = require('fs');
const _ = require('lodash');
const GenerateCSV = require('./generateCSV');
const moment = require('moment');

const data = [
  ['0A', '0B', '0C'],
  ['1A', '1B', '1C'],
  ['2A', '2B', '2C']
];

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

      console.log(this.getValue({ date, token }, data));
    }
  }

  debug () {
    if (this.isDebug) {
      console.log(...arguments);
    }
  }

  loadCSV (filepath) {
    const results = [];
    const promise = new Promise((resolve, reject) => {
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
          this.debug(results);
          resolve(results);
        })
        .on('error', (e) => { reject(e); });
    });
    return promise;
  }

  getValue ({ date, token }, data) {
    const result = {};
    _.each(data, d => {
      if (result[d.token] === undefined) {
        result[d.token] = 0;
      }

      const calculateCurrentPosition = () => {
        if (d.transaction_type === 'WITHDRAWAL') {
          result[d.token] -= d.amount;
        } else {
          result[d.token] += d.amount;
        }
      };

      if (date) {
        const mParamDate = moment(date).endOf('d');
        const mDate = moment(data.timestamp);
        if (mDate.isSameOrBefore(mParamDate)) {
          calculateCurrentPosition();
        }
      } else {
        calculateCurrentPosition();
      }
    });

    if (token) {
      return _.pick(result, token);
    }
    return result;
  }
}

module.exports = PortfolioManager;
