const IngPlIngbplpw = require('../ing-pl-ingbplpw');

describe('IngPlIngbplpw', () => {
  let bank;
  beforeEach(() => (bank = new IngPlIngbplpw()));

  describe('#normalizeAccount', () => {
    const accountRaw = {
      resourceId: 'PL00000000000000000987654321',
      iban: 'PL00000000000000000987654321',
      currency: 'PLN',
      ownerName: 'John Example',
      product: 'Current Account for Individuals (Retail)',
      bic: 'INGBPLPW',
      ownerAddressUnstructured: [
        'UL. EXAMPLE STREET 10 M.1',
        '00-000 WARSZAWA'
      ],
      id: 'd3eccc94-9536-48d3-98be-813f79199ee3',
      created: '2022-07-24T20:45:47.929582Z',
      last_accessed: '2023-01-24T22:12:00.193558Z',
      institution_id: 'ING_PL_INGBPLPW',
      status: 'READY',
      owner_name: '',
      institution: {
        id: 'ING_PL_INGBPLPW',
        name: 'ING',
        bic: 'INGBPLPW',
        transaction_total_days: '365',
        countries: ['PL'],
        logo: 'https://cdn.nordigen.com/ais/ING_PL_INGBPLPW.png',
        supported_payments: {},
        supported_features: [
          'access_scopes',
          'business_accounts',
          'card_accounts',
          'corporate_accounts',
          'pending_transactions',
          'private_accounts'
        ]
      }
    };

    it('returns normalized account data returned to Frontend', () => {
      expect(bank.normalizeAccount(accountRaw)).toMatchInlineSnapshot(`
          {
            "account_id": "d3eccc94-9536-48d3-98be-813f79199ee3",
            "institution": {
              "bic": "INGBPLPW",
              "countries": [
                "PL",
              ],
              "id": "ING_PL_INGBPLPW",
              "logo": "https://cdn.nordigen.com/ais/ING_PL_INGBPLPW.png",
              "name": "ING",
              "supported_features": [
                "access_scopes",
                "business_accounts",
                "card_accounts",
                "corporate_accounts",
                "pending_transactions",
                "private_accounts",
              ],
              "supported_payments": {},
              "transaction_total_days": "365",
            },
            "mask": "4321",
            "name": "Current Account for Individuals (Retail) (XXX 4321)",
            "official_name": "Current Account for Individuals (Retail)",
            "type": "checking",
          }
        `);
    });
  });

  describe('#sortTransactions', () => {
    it('sorts transactions by time and sequence from newest to oldest', () => {
      const transactions = [
        { transactionId: 'D202301180000003' },
        { transactionId: 'D202301180000004' },
        { transactionId: 'D202301230000001' },
        { transactionId: 'D202301180000002' },
        { transactionId: 'D202301200000001' }
      ];
      const sortedTransactions = bank.sortTransactions(transactions);
      expect(sortedTransactions).toEqual([
        { transactionId: 'D202301230000001' },
        { transactionId: 'D202301200000001' },
        { transactionId: 'D202301180000004' },
        { transactionId: 'D202301180000003' },
        { transactionId: 'D202301180000002' }
      ]);
    });

    it('handles empty arrays', () => {
      const transactions = [];
      const sortedTransactions = bank.sortTransactions(transactions);
      expect(sortedTransactions).toEqual([]);
    });

    it('returns empty array for undefined input', () => {
      const sortedTransactions = bank.sortTransactions(undefined);
      expect(sortedTransactions).toEqual([]);
    });
  });

  describe('#countStartingBalance', () => {
    it('should calculate the starting balance correctly', () => {
      const sortedTransactions = [
        {
          transactionAmount: { amount: '-100.00', currency: 'USD' },
          balanceAfterTransaction: {
            balanceAmount: { amount: '400.00', currency: 'USD' }
          }
        },
        {
          transactionAmount: { amount: '50.00', currency: 'USD' },
          balanceAfterTransaction: {
            balanceAmount: { amount: '450.00', currency: 'USD' }
          }
        },
        {
          transactionAmount: { amount: '-25.00', currency: 'USD' },
          balanceAfterTransaction: {
            balanceAmount: { amount: '475.00', currency: 'USD' }
          }
        }
      ];
      const balances = [
        {
          balanceType: 'interimBooked',
          balanceAmount: { amount: '500.00', currency: 'USD' }
        },
        {
          balanceType: 'other',
          balanceAmount: { amount: '600.00', currency: 'USD' }
        }
      ];

      const startingBalance = bank.calculateStartingBalance(
        sortedTransactions,
        balances
      );

      expect(startingBalance).toEqual(50000);
    });

    it('returns the same balance amount when no transactions', () => {
      const transactions = [];
      const balances = [
        {
          balanceType: 'interimBooked',
          balanceAmount: { amount: '500.00', currency: 'USD' }
        }
      ];
      expect(bank.calculateStartingBalance(transactions, balances)).toEqual(
        50000
      );
    });
  });
});
