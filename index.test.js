const PortfolioManager = require('./index');
const moment = require('moment');

describe('PortfolioManager', () => {
  const data = [
    { timestamp: moment('2020-01-01').unix(), transaction_type: 'DEPOSIT', token: 'SHIB', amount: 0.29042397821800864 },
    { timestamp: moment('2020-01-01').unix(), transaction_type: 'WITHDRAWAL', token: 'CRO', amount: 0.19544706682335997 },
    { timestamp: moment('2020-01-01').unix(), transaction_type: 'DEPOSIT', token: 'DOGE', amount: 0.7994686780411233 },
    { timestamp: moment('2020-01-02').unix(), transaction_type: 'WITHDRAWAL', token: 'DOGE', amount: 0.43485920355747393 },
    { timestamp: moment('2020-01-03').unix(), transaction_type: 'WITHDRAWAL', token: 'DOGE', amount: 0.43485920355747393 },
    { timestamp: moment('2020-01-04').unix(), transaction_type: 'WITHDRAWAL', token: 'DOGE', amount: 0.43485920355747393 },
    { timestamp: moment('2020-01-05').unix(), transaction_type: 'DEPOSIT', token: 'DOGE', amount: 0.7994686780411233 },
    { timestamp: moment('2020-01-06').unix(), transaction_type: 'DEPOSIT', token: 'DOGE', amount: 0.7994686780411233 }
  ];
  let getExchangeRatesMock;
  let pManager;
  const mockDateString = moment().format('YYYY-MM-DD');
  beforeEach(() => {
    const args = {
      f: './data.csv'
    };
    pManager = new PortfolioManager(args);
  });
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getValue', () => {
    it('should run correctly with no additional params', async () => {
      getExchangeRatesMock = jest.spyOn(pManager, 'getExchangeRates')
        .mockResolvedValueOnce({ SHIB: { USD: 0.2 } })
        .mockResolvedValueOnce({ CRO: { USD: 0.3 } })
        .mockResolvedValueOnce({ DOGE: { USD: 0.5 } });

      const result = await pManager.getValue({}, data);
      expect(getExchangeRatesMock).toBeCalledTimes(3);
      expect(result).toBeTruthy();
      expect(result).toHaveLength(3);

      expect(result[0]).toEqual(['SHIB', 0.29042397821800864, 0.29042397821800864 * 0.2, mockDateString]);
      expect(result[1]).toEqual(['CRO', -0.19544706682335997, -0.19544706682335997 * 0.3, mockDateString]);
      expect(result[2]).toEqual(['DOGE', 0.7994686780411233 * 3 - 0.43485920355747393 * 3,
        (0.7994686780411233 * 3 - 0.43485920355747393 * 3) * 0.5, mockDateString]);
    });

    it('should return only data associated with the token param', async () => {
      getExchangeRatesMock = jest.spyOn(pManager, 'getExchangeRates')
        .mockResolvedValueOnce({ DOGE: { USD: 0.5 } });

      const result = await pManager.getValue({ token: 'DOGE' }, data);
      expect(getExchangeRatesMock).toBeCalledTimes(1);
      expect(result).toBeTruthy();
      expect(result).toHaveLength(1);

      expect(result[0]).toEqual(['DOGE', 0.7994686780411233 * 3 - 0.43485920355747393 * 3,
        (0.7994686780411233 * 3 - 0.43485920355747393 * 3) * 0.5, mockDateString]);
    });

    it('should return only data before or equal to the date param', async () => {
      getExchangeRatesMock = jest.spyOn(pManager, 'getExchangeRates')
        .mockResolvedValueOnce({ SHIB: { USD: 0.2 } })
        .mockResolvedValueOnce({ CRO: { USD: 0.3 } })
        .mockResolvedValueOnce({ DOGE: { USD: 0.5 } });

      const result = await pManager.getValue({ date: '2020-01-04' }, data);
      expect(getExchangeRatesMock).toBeCalledTimes(3);
      expect(result).toBeTruthy();
      expect(result).toHaveLength(3);

      expect(result[0]).toEqual(['SHIB', 0.29042397821800864, 0.29042397821800864 * 0.2, '2020-01-04']);
      expect(result[1]).toEqual(['CRO', -0.19544706682335997, -0.19544706682335997 * 0.3, '2020-01-04']);
      expect(result[2]).toEqual(['DOGE', 0.7994686780411233 - 0.43485920355747393 * 3,
        (0.7994686780411233 - 0.43485920355747393 * 3) * 0.5, '2020-01-04']);
    });

    it('should return only data before or equal to the date param and associated with the token param', async () => {
      getExchangeRatesMock = jest.spyOn(pManager, 'getExchangeRates')
        .mockResolvedValueOnce({ DOGE: { USD: 0.5 } });

      const result = await pManager.getValue({ date: '2020-01-04', token: 'DOGE' }, data);
      expect(getExchangeRatesMock).toBeCalledTimes(1);
      expect(result).toBeTruthy();
      expect(result).toHaveLength(1);

      expect(result[0]).toEqual(['DOGE', 0.7994686780411233 - 0.43485920355747393 * 3,
        (0.7994686780411233 - 0.43485920355747393 * 3) * 0.5, '2020-01-04']);
    });
  });
});
