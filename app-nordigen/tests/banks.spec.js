const BankFactory = require('../banks');

describe('Banks', () => {
  describe('MbankRetailBrexplpw', () => {
    const institutionId = 'MBANK_RETAIL_BREXPLPW';
    let bank;

    beforeEach(() => (bank = BankFactory(institutionId)));

    describe('#normalizeAccount', () => {
      const accountRaw = {
        iban: 'PL00000000000000000987654321',
        currency: 'PLN',
        ownerName: 'John Example',
        displayName: 'EKONTO',
        product: 'RACHUNEK BIEŻĄCY',
        usage: 'PRIV',
        ownerAddressUnstructured: [
          'POL',
          'UL. EXAMPLE STREET 10 M.1',
          '00-000 WARSZAWA'
        ],
        id: 'd3eccc94-9536-48d3-98be-813f79199ee3',
        created: '2023-01-18T13:24:55.879512Z',
        last_accessed: null,
        institution_id: 'MBANK_RETAIL_BREXPLPW',
        status: 'READY',
        owner_name: '',
        institution: {
          id: 'MBANK_RETAIL_BREXPLPW',
          name: 'mBank Retail',
          bic: 'BREXPLPW',
          transaction_total_days: '90',
          countries: ['PL'],
          logo: 'https://cdn.nordigen.com/ais/MBANK_RETAIL_BREXCZPP.png',
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
                      "bic": "BREXPLPW",
                      "countries": [
                        "PL",
                      ],
                      "id": "MBANK_RETAIL_BREXPLPW",
                      "logo": "https://cdn.nordigen.com/ais/MBANK_RETAIL_BREXCZPP.png",
                      "name": "mBank Retail",
                      "supported_features": [
                        "access_scopes",
                        "business_accounts",
                        "card_accounts",
                        "corporate_accounts",
                        "pending_transactions",
                        "private_accounts",
                      ],
                      "supported_payments": {},
                      "transaction_total_days": "90",
                    },
                    "mask": "4321",
                    "name": "EKONTO (XXX 4321)",
                    "official_name": "RACHUNEK BIEŻĄCY",
                    "type": "checking",
                  }
              `);
      });
    });

    describe('#sortTransactions', () => {
      it('returns transactions from newest to oldest', () => {
        const sortedTransactions = bank.sortTransactions([
          { transactionId: '202212300001' },
          { transactionId: '202212300003' },
          { transactionId: '202212300002' },
          { transactionId: '202212300000' },
          { transactionId: '202112300001' }
        ]);

        expect(sortedTransactions).toEqual([
          { transactionId: '202212300003' },
          { transactionId: '202212300002' },
          { transactionId: '202212300001' },
          { transactionId: '202212300000' },
          { transactionId: '202112300001' }
        ]);
      });

      it('returns empty array for empty input', () => {
        const sortedTransactions = bank.sortTransactions([]);
        expect(sortedTransactions).toEqual([]);
      });

      it('returns empty array for undefined input', () => {
        const sortedTransactions = bank.sortTransactions(undefined);
        expect(sortedTransactions).toEqual([]);
      });
    });

    describe('#countStartingBalance', () => {
      it('returns the same balance amount when no transactions', () => {
        const transactions = [];
        const balances = [
          {
            balanceAmount: { amount: '1000.00', currency: 'PLN' },
            balanceType: 'interimBooked'
          }
        ];
        expect(bank.calculateStartingBalance(transactions, balances)).toEqual(
          100000
        );
      });

      it('returns the balance minus the available transactions', () => {
        const transactions = [
          {
            transactionAmount: { amount: '200.00', currency: 'PLN' }
          },
          {
            transactionAmount: { amount: '300.50', currency: 'PLN' }
          }
        ];
        const balances = [
          {
            balanceAmount: { amount: '1000.00', currency: 'PLN' },
            balanceType: 'interimBooked'
          }
        ];
        expect(bank.calculateStartingBalance(transactions, balances)).toEqual(
          49950
        );
      });
    });
  });

  describe('SandboxfinanceSfin0000', () => {
    const institutionId = 'SANDBOXFINANCE_SFIN0000';
    let bank;

    beforeEach(() => (bank = BankFactory(institutionId)));

    describe('#normalizeAccount', () => {
      const accountRaw = {
        resourceId: '01F3NS5ASCNMVCTEJDT0G215YE',
        iban: 'GL0865354374424724',
        currency: 'EUR',
        ownerName: 'Jane Doe',
        name: 'Main Account',
        product: 'Checkings',
        cashAccountType: 'CACC',
        id: '99a0bfe2-0bef-46df-bff2-e9ae0c6c5838',
        created: '2022-02-21T13:43:55.608911Z',
        last_accessed: '2023-01-25T16:50:15.078264Z',
        institution_id: 'SANDBOXFINANCE_SFIN0000',
        status: 'READY',
        owner_name: 'Jane Doe',
        institution: {
          id: 'SANDBOXFINANCE_SFIN0000',
          name: 'Sandbox Finance',
          bic: 'SFIN0000',
          transaction_total_days: '90',
          countries: ['XX'],
          logo: 'https://cdn.nordigen.com/ais/SANDBOXFINANCE_SFIN0000.png',
          supported_payments: {},
          supported_features: []
        }
      };

      it('returns normalized account data returned to Frontend', () => {
        expect(bank.normalizeAccount(accountRaw)).toMatchInlineSnapshot(`
          {
            "account_id": "99a0bfe2-0bef-46df-bff2-e9ae0c6c5838",
            "institution": {
              "bic": "SFIN0000",
              "countries": [
                "XX",
              ],
              "id": "SANDBOXFINANCE_SFIN0000",
              "logo": "https://cdn.nordigen.com/ais/SANDBOXFINANCE_SFIN0000.png",
              "name": "Sandbox Finance",
              "supported_features": [],
              "supported_payments": {},
              "transaction_total_days": "90",
            },
            "mask": "4724",
            "name": "Main Account (XXX 4724)",
            "official_name": "Checkings",
            "type": "checking",
          }
        `);
      });
    });

    describe('#sortTransactions', () => {
      it('sorts transactions by time and sequence from newest to oldest', () => {
        const transactions = [
          { transactionId: '2023012301927902-2' },
          { transactionId: '2023012301927902-1' },
          { transactionId: '2023012301927900-2' },
          { transactionId: '2023012301927900-1' },
          { transactionId: '2023012301927900-3' }
        ];
        const sortedTransactions = bank.sortTransactions(transactions);
        expect(sortedTransactions).toEqual([
          { transactionId: '2023012301927902-2' },
          { transactionId: '2023012301927902-1' },
          { transactionId: '2023012301927900-3' },
          { transactionId: '2023012301927900-2' },
          { transactionId: '2023012301927900-1' }
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
            transactionId: '2022-01-01-1',
            transactionAmount: { amount: '-100.00', currency: 'USD' }
          },
          {
            transactionId: '2022-01-01-2',
            transactionAmount: { amount: '50.00', currency: 'USD' }
          },
          {
            transactionId: '2022-01-01-3',
            transactionAmount: { amount: '-25.00', currency: 'USD' }
          }
        ];
        const balances = [
          {
            balanceType: 'interimAvailable',
            balanceAmount: { amount: '1000.00', currency: 'USD' }
          },
          {
            balanceType: 'other',
            balanceAmount: { amount: '500.00', currency: 'USD' }
          }
        ];

        const startingBalance = bank.calculateStartingBalance(
          sortedTransactions,
          balances
        );

        expect(startingBalance).toEqual(107500);
      });

      it('returns the same balance amount when no transactions', () => {
        const transactions = [];
        const balances = [
          {
            balanceAmount: { amount: '1000.00', currency: 'PLN' },
            balanceType: 'interimAvailable'
          }
        ];
        expect(bank.calculateStartingBalance(transactions, balances)).toEqual(
          100000
        );
      });

      it('returns the balance minus the available transactions', () => {
        const transactions = [
          {
            transactionAmount: { amount: '200.00', currency: 'PLN' }
          },
          {
            transactionAmount: { amount: '300.50', currency: 'PLN' }
          }
        ];
        const balances = [
          {
            balanceAmount: { amount: '1000.00', currency: 'PLN' },
            balanceType: 'interimAvailable'
          }
        ];
        expect(bank.calculateStartingBalance(transactions, balances)).toEqual(
          49950
        );
      });
    });
  });

  describe('IngPlIngbplpw', () => {
    const institutionId = 'ING_PL_INGBPLPW';
    let bank;

    beforeEach(() => (bank = BankFactory(institutionId)));

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
            balanceAfterTransaction: {balanceAmount: { amount: '400.00', currency: 'USD' }}
          },
          {
            transactionAmount: { amount: '50.00', currency: 'USD' },
            balanceAfterTransaction: {balanceAmount: { amount: '450.00', currency: 'USD' }}
          },
          {
            transactionAmount: { amount: '-25.00', currency: 'USD' },
            balanceAfterTransaction: {balanceAmount: { amount: '475.00', currency: 'USD' }}
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
          },
        ];
        expect(bank.calculateStartingBalance(transactions, balances)).toEqual(
          50000
        );
      });
    });
  });
});
