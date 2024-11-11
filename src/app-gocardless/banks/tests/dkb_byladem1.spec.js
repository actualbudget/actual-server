import Dkb_byladem1 from '../dkb_byladem1.js';
import { mockTransactionAmount } from '../../services/tests/fixtures.js';

describe('dkb_byladem1', function () {
  describe('#normalizeAccount', function () {
    /** @type {import('../../gocardless.types.js').DetailedAccountWithInstitution} */
    const accountRaw = {
      resourceId: 'd1c61254-242e-4a88-aaff-8490846e2491',
      iban: 'DE02500105170137075030',
      currency: 'EUR',
      ownerName: 'Jane Doe',
      product: 'Girokonto',
      id: 'a787ba27-02ee-4fd6-be86-73831adc5498',
      created: '2023-09-04T14:38:58.841381Z',
      last_accessed: '2024-11-08T08:48:39.667722Z',
      institution_id: 'DKB_BYLADEM1',
      status: 'READY',
      owner_name: 'Jane Doe',
      cashAccountType: 'CACC',
      usage: 'PRIV',
      institution: {
        id: 'DKB_BYLADEM1',
        name: 'Deutsche Kreditbank AG (DKB)',
        bic: 'BALLADE1001',
        transaction_total_days: '365',
        countries: ['DE'],
        logo: 'https://storage.googleapis.com/gc-prd-institution_icons-production/DE/PNG/deutschekreditbank.png',
        supported_payments: {
          'single-payment': ['SCT', 'ISCSI'],
        },
        supported_features: [
          'business_accounts',
          'corporate_accounts',
          'payments',
          'pending_transactions',
          'private_accounts',
        ],
      },
    };

    it('should normalize the account information', function () {
      const actual = Dkb_byladem1.normalizeAccount(accountRaw);
      expect(actual).toEqual({
        account_id: 'a787ba27-02ee-4fd6-be86-73831adc5498',
        iban: 'DE02500105170137075030',
        institution: {
          id: 'DKB_BYLADEM1',
          name: 'Deutsche Kreditbank AG (DKB)',
          bic: 'BALLADE1001',
          transaction_total_days: '365',
          countries: ['DE'],
          logo: 'https://storage.googleapis.com/gc-prd-institution_icons-production/DE/PNG/deutschekreditbank.png',
          supported_payments: {
            'single-payment': ['SCT', 'ISCSI'],
          },
          supported_features: [
            'business_accounts',
            'corporate_accounts',
            'payments',
            'pending_transactions',
            'private_accounts',
          ],
        },
        mask: '5030',
        name: 'Girokonto (XXX 5030)',
        official_name: 'Girokonto',
        type: 'checking',
      });
    });
  });

  describe('#sortTransactions', function () {
    const transactionsRaw = [
      {
        transactionId: '2024-11-05-00.25.38.982769',
        transactionAmount: mockTransactionAmount,
      },
      {
        transactionId: '2024-11-05-01.25.38.982769',
        transactionAmount: mockTransactionAmount,
      },
      {
        transactionId: '2024-11-04-01.26.38.982769',
        transactionAmount: mockTransactionAmount,
      },
      {
        transactionId: '2024-11-05-01.26.38.982769',
        transactionAmount: mockTransactionAmount,
      },
    ];

    const expected = [
      {
        transactionId: '2024-11-05-01.26.38.982769',
        transactionAmount: mockTransactionAmount,
      },
      {
        transactionId: '2024-11-05-01.25.38.982769',
        transactionAmount: mockTransactionAmount,
      },
      {
        transactionId: '2024-11-05-00.25.38.982769',
        transactionAmount: mockTransactionAmount,
      },
      {
        transactionId: '2024-11-04-01.26.38.982769',
        transactionAmount: mockTransactionAmount,
      },
    ];

    it('should sort by transaction id', function () {
      const actual = Dkb_byladem1.sortTransactions(transactionsRaw);
      expect(actual).toEqual(expected);
    });
  });
});
