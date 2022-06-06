const _ = require('lodash');
const { isMainThread, parentPort, workerData } = require('node:worker_threads');

function processLines () {
  if (!isMainThread) {
    const { lines, tsDate, token } = workerData;
    const result = {};
    _.each(lines, line => {
      const arr = _.split(line, ',');
      const data = {
        timestamp: parseInt(arr[0]),
        token: arr[2]
      };

      if (token && data.token !== token) {
        return;
      }
      if (tsDate && tsDate < data.date) {
        return;
      }

      data.transaction_type = arr[1];
      data.amount = arr[1] === 'DEPOSIT' ? parseFloat(arr[3]) : -parseFloat(arr[3]);
      result[data.token] = (result[data.token] || 0) + data.amount;
    });
    parentPort.postMessage(result);
  }
}
processLines();
