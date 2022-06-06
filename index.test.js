const PortfolioManager = require('./index');
const moment = require('moment');
const axios = require('axios');

describe('PortfolioManager', () => {
  let getExchangeRatesMock;
  let pManager;
  const mockDateString = moment().format('YYYY-MM-DD');

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getValue', () => {
    beforeEach(() => {
      const args = {
        f: './data.csv'
      };
      pManager = new PortfolioManager(args);
    });
    it('should run correctly with no additional params', async () => {
      getExchangeRatesMock = jest.spyOn(pManager, 'getExchangeRates')
        .mockResolvedValueOnce({ SHIB: { USD: 0.2 } })
        .mockResolvedValueOnce({ CRO: { USD: 0.3 } })
        .mockResolvedValueOnce({ DOGE: { USD: 0.5 } });

      const result = await pManager.getValue({
        SHIB: 0.29042397821800864,
        CRO: -0.19544706682335997,
        DOGE: 0.7994686780411233 * 3 - 0.43485920355747393 * 3
      }, undefined);
      expect(getExchangeRatesMock).toBeCalledTimes(3);
      expect(result).toBeTruthy();
      expect(result).toHaveLength(3);

      expect(result[0]).toEqual(['SHIB', 0.29042397821800864, 0.29042397821800864 * 0.2, mockDateString]);
      expect(result[1]).toEqual(['CRO', -0.19544706682335997, -0.19544706682335997 * 0.3, mockDateString]);
      expect(result[2]).toEqual(['DOGE', 0.7994686780411233 * 3 - 0.43485920355747393 * 3,
        (0.7994686780411233 * 3 - 0.43485920355747393 * 3) * 0.5, mockDateString]);
    });

    it('should return only data before or equal to the date param', async () => {
      getExchangeRatesMock = jest.spyOn(pManager, 'getExchangeRates')
        .mockResolvedValueOnce({ SHIB: { USD: 0.2 } })
        .mockResolvedValueOnce({ CRO: { USD: 0.3 } })
        .mockResolvedValueOnce({ DOGE: { USD: 0.5 } });

      const result = await pManager.getValue({
        SHIB: 0.29042397821800864,
        CRO: -0.19544706682335997,
        DOGE: 0.7994686780411233 * 3 - 0.43485920355747393 * 3
      }, mockDateString);

      expect(getExchangeRatesMock).toBeCalledTimes(3);
      expect(result).toBeTruthy();
      expect(result).toHaveLength(3);

      expect(result[0]).toEqual(['SHIB', 0.29042397821800864, 0.29042397821800864 * 0.2, mockDateString]);
      expect(result[1]).toEqual(['CRO', -0.19544706682335997, -0.19544706682335997 * 0.3, mockDateString]);
      expect(result[2]).toEqual(['DOGE', 0.7994686780411233 * 3 - 0.43485920355747393 * 3,
        (0.7994686780411233 * 3 - 0.43485920355747393 * 3) * 0.5, mockDateString]);
    });
  });

  describe('run', () => {
    describe('f argument', () => {
      it('should run correctly in case of no addition filepath', () => {
        pManager = new PortfolioManager({ f: true });
        const loadCSVMock = jest.spyOn(pManager, 'loadCSV')
          .mockResolvedValueOnce([]);
        pManager.run({ f: true });
        expect(loadCSVMock).toBeCalledWith('./data.csv', undefined, undefined);
      });
      it('should run correctly in case of missing f', () => {
        pManager = new PortfolioManager({ });
        const loadCSVMock = jest.spyOn(pManager, 'loadCSV')
          .mockResolvedValueOnce([]);
        pManager.run({ });
        expect(loadCSVMock).not.toBeCalled();
      });
      it('should run correctly in case filepath exists', () => {
        pManager = new PortfolioManager({ f: 'mockdata.csv' });
        const loadCSVMock = jest.spyOn(pManager, 'loadCSV')
          .mockResolvedValueOnce([]);
        pManager.run({ f: 'mockdata.csv' });
        expect(loadCSVMock).toBeCalledWith('mockdata.csv', undefined, undefined);
      });
      it('should handle exceptions', () => {
        const NotFoundErr = new Error('not found');
        pManager = new PortfolioManager({ f: 'mockdata.csv' });
        const loadCSVMock = jest.spyOn(pManager, 'loadCSV').mockImplementation(() => {
          throw NotFoundErr;
        });
        const debugMock = jest.spyOn(pManager, 'debug');

        pManager.run({ f: 'mockdata.csv' });
        expect(loadCSVMock).toBeCalledWith('mockdata.csv', undefined, undefined);
        expect(debugMock).toBeCalled();
      });
    });
    describe('token & date arguments', () => {
      it('should handle token & date arguments correctly', async () => {
        pManager = new PortfolioManager({ token: 'token', date: 'date', f: 'data.csv' });
        const loadCsvMock = jest.spyOn(pManager, 'loadCSV').mockResolvedValueOnce({});
        const getValueMock = jest.spyOn(pManager, 'getValue').mockResolvedValueOnce([]);
        const consoleMock = jest.spyOn(console, 'log').mockImplementation(() => {});

        await pManager.run({ token: 'token', date: 'date', f: 'data.csv' });
        expect(loadCsvMock).toBeCalled();
        expect(getValueMock).toBeCalledWith({}, 'date');
        expect(consoleMock).toBeCalled();
      });
      it('should handle empty token & date arguments correctly', async () => {
        pManager = new PortfolioManager({ token: true, date: true, f: 'data.csv' });
        const loadCsvMock = jest.spyOn(pManager, 'loadCSV').mockResolvedValueOnce({});
        const getValueMock = jest.spyOn(pManager, 'getValue').mockResolvedValueOnce([]);
        const consoleMock = jest.spyOn(console, 'log').mockImplementation(() => {});

        await pManager.run({ token: true, date: true, f: 'data.csv' });
        expect(loadCsvMock).toBeCalled();
        expect(getValueMock).toBeCalledWith({}, undefined);
        expect(consoleMock).toBeCalled();
      });
    });
  });
  describe('debug', () => {
    it('should log when enabled', () => {
      const consoleMock = jest.spyOn(console, 'log').mockImplementation(() => {});
      pManager = new PortfolioManager({ v: true });
      pManager.debug('');
      expect(consoleMock).toBeCalledTimes(1);
    });
    it('should not log when disabled', () => {
      const consoleMock = jest.spyOn(console, 'log').mockImplementation(() => {});
      pManager = new PortfolioManager({ v: false });
      pManager.debug('');
      expect(consoleMock).not.toBeCalled();
    });
  });
  describe('getExchangeRates', () => {
    it('show call the correct API with correct query string', async () => {
      const axiosMock = jest.spyOn(axios, 'get').mockResolvedValueOnce({});
      pManager = new PortfolioManager({});
      await pManager.getExchangeRates('DOGE', 1654333919);
      expect(axiosMock).toBeCalledWith('https://min-api.cryptocompare.com/data/pricehistorical?fsym=DOGE&tsyms=USD&ts=1654333919', expect.anything());
    });

    it('show log error in case of error', async () => {
      const error = new Error('mock');
      const axiosMock = jest.spyOn(axios, 'get').mockRejectedValue(error);
      pManager = new PortfolioManager({});
      const debugMock = jest.spyOn(pManager, 'debug');

      await pManager.getExchangeRates('DOGE', 1654333919);
      expect(axiosMock).toBeCalledWith('https://min-api.cryptocompare.com/data/pricehistorical?fsym=DOGE&tsyms=USD&ts=1654333919', expect.anything());
      expect(debugMock).toBeCalledWith(error);
    });
  });
  describe('loadCSV', () => {
    it('should parse csv & return data', async () => {
      pManager = new PortfolioManager({});
      pManager.LINES_COUNT_FOR_WORKER = 2;
      const result = await pManager.loadCSV('./mockCSV.csv');
      expect(result).toBeTruthy();

      expect(result).toEqual(
        {
          SHIB: 0.29042397821800864,
          CRO: -0.19544706682335997,
          DOGE: 0.7994686780411233 * 3 - 0.43485920355747393 * 3
        }
      );
    });

    it('should return only data associated with the token param', async () => {
      const args = { token: 'DOGE' };
      pManager = new PortfolioManager(args);
      pManager.LINES_COUNT_FOR_WORKER = 2;
      const result = await pManager.loadCSV('./mockCSV.csv', 'DOGE');
      expect(result).toBeTruthy();

      expect(result).toEqual(
        {
          DOGE: 0.7994686780411233 * 3 - 0.43485920355747393 * 3
        }
      );
    });

    it('should return only data before or equal to the date param', async () => {
      const args = { date: moment };
      pManager = new PortfolioManager(args);
      pManager.LINES_COUNT_FOR_WORKER = 2;
      console.log(moment.unix(1954333917).format('YYYY-MM-DD'));
      const result = await pManager.loadCSV('./mockCSV.csv', undefined, '2022-06-04');
      expect(result).toBeTruthy();

      expect(result).toEqual(
        {
          CRO: -0.19544706682335997,
          DOGE: 0.7994686780411233 * 2 - 0.43485920355747393 * 3,
          SHIB: 0.29042397821800864
        }
      );
    });

    it('should return only data before or equal to the date param and associated with the token param', async () => {
      const args = { token: 'DOGE', date: moment };
      pManager = new PortfolioManager(args);
      pManager.LINES_COUNT_FOR_WORKER = 2;
      console.log(moment.unix(1954333917).format('YYYY-MM-DD'));
      const result = await pManager.loadCSV('./mockCSV.csv', 'DOGE', '2022-06-04');
      expect(result).toBeTruthy();

      expect(result).toEqual(
        {
          DOGE: 0.7994686780411233 * 2 - 0.43485920355747393 * 3
        }
      );
    });
  });
});
