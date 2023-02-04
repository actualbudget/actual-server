const IntegrationBank = require('../integration-bank');

describe('IntegrationBank', () => {
  let integrationBank;

  let consoleSpy;

  beforeEach(() => {
    consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    integrationBank = new IntegrationBank();
  });

  describe('normalizeAccount', () => {
    it('should return a normalized account object', () => {
      const account = {
        id: '1234',
        institution: { name: 'Test Institution' },
        institution_id: 'test-institution',
        iban: '1234'
      };

      const normalizedAccount = integrationBank.normalizeAccount(account);
      expect(normalizedAccount).toEqual({
        account_id: '1234',
        institution: { name: 'Test Institution' },
        mask: '1234',
        name: 'integration-test-institution',
        official_name: 'integration-test-institution',
        type: 'checking'
      });
    });

    it('should return a normalized account object with masked value "0000" when no iban property is provided', () => {
      const account = {
        id: '1234',
        institution: { name: 'Test Institution' },
        institution_id: 'test-institution'
      };

      const normalizedAccount = integrationBank.normalizeAccount(account);
      expect(normalizedAccount).toEqual({
        account_id: '1234',
        institution: { name: 'Test Institution' },
        mask: '0000',
        name: 'integration-test-institution',
        official_name: 'integration-test-institution',
        type: 'checking'
      });
    });

    it('normalizeAccount logs available account properties', () => {
      const account = {
        id: '1234',
        institution: { name: 'Test Institution' },
        institution_id: 'test-institution',
        iban: '1234'
      };

      integrationBank.normalizeAccount(account);
      expect(consoleSpy).toHaveBeenCalledWith(
        'Available account properties for new institution integration',
        { account: JSON.stringify(account) }
      );
    });
  });

  describe('sortTransactions', () => {
    const transactions = [
      { date: '2022-01-01', amount: 100 },
      { date: '2022-01-02', amount: 200 },
      { date: '2022-01-03', amount: 300 }
    ];

    it('should return the same array of transactions that was passed to it', () => {
      const sortedTransactions = integrationBank.sortTransactions(transactions);
      expect(sortedTransactions).toEqual(transactions);
    });

    it('sortTransactions logs available transactions properties', () => {
      integrationBank.sortTransactions(transactions);
      expect(consoleSpy).toHaveBeenCalledWith(
        'Available (first 10) transactions properties for new integration of institution in sortTransactions function',
        { top10Transactions: JSON.stringify(transactions.slice(0, 10)) }
      );
    });
  });

  describe('calculateStartingBalance', () => {
    const transactions = [
      { date: '2022-01-01', amount: 100 },
      { date: '2022-02-01', amount: 200 },
      { date: '2022-03-01', amount: 300 }
    ];
    const balances = [
      { date: '2022-01-01', amount: 1000 },
      { date: '2022-02-01', amount: 2000 },
      { date: '2022-03-01', amount: 3000 }
    ];

    it('should return 0 when no transactions or balances are provided', () => {
      const startingBalance = integrationBank.calculateStartingBalance();
      expect(startingBalance).toEqual(0);
    });

    it('should return 0 when transactions and balances are provided', () => {
      const startingBalance = integrationBank.calculateStartingBalance(
        transactions,
        balances
      );
      expect(startingBalance).toEqual(0);
    });

    it('logs available transactions and balances properties', () => {
      integrationBank.calculateStartingBalance(transactions, balances);
      expect(consoleSpy).toHaveBeenCalledWith(
        'Available (first 10) transactions properties for new integration of institution in calculateStartingBalance function',
        {
          balances: JSON.stringify(balances),
          top10SortedTransactions: JSON.stringify(transactions.slice(0, 10))
        }
      );
    });
  });
});
