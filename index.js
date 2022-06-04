const { table } = require('table');
const csv = require('csv-parser');
const fs = require('fs');
const _ = require('lodash');
const GenerateCSV = require('./generateCSV');

const data = [
  ['0A', '0B', '0C'],
  ['1A', '1B', '1C'],
  ['2A', '2B', '2C'],
];

class PortfolioManager {
  run(args) {
    if (args.g !== undefined) {
      const filepath = args.g;
      if (_.isString(filepath) && filepath) {
        return new GenerateCSV().run(filepath);
      }
      throw new Error('filepath missing');
    }

    let data;
    if (args.f !== undefined) {
      const filepath = args.f;
      try {
        if (_.isString(filepath) && filepath) {
          data = this.loadCSV(filepath);
        } else {
          data = this.loadCSV('./data.csv');
        }
      } catch (e) {
        console.error(e);
      }
    }

    if (data) {
      let { token } = args;
      token = token === true ? undefined : token;
      let { date } = args;
      date = date === true ? undefined : date;

      this.getValue({ date, token }, data);
    }
  }

  loadCSV(filepath) {
    const results = [];
    fs.createReadStream(filepath)
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', () => {});
    return results;
  }

  getValue({ date, token }) {
    return null;
  }
}

new PortfolioManager().run([]);
module.exports = PortfolioManager;
