import BerlinerSparkasse from '../berliner_sparkasse_beladebexxx.js';
import { mockTransactionAmount } from '../../services/tests/fixtures.js';

describe('BerlinerSparkasse', () => {
  describe('#normalizeTransaction', () => {
    it('returns the internalTransactionId as transactionId', () => {
      const transaction = {
        transactionId: 'non-unique-id',
        internalTransactionId: 'D202301180000003',
        transactionAmount: mockTransactionAmount,
      };
      const normalizedTransaction = BerlinerSparkasse.normalizeTransaction(
        transaction,
        true,
      );
      expect(normalizedTransaction.transactionId).toEqual(
        transaction.internalTransactionId,
      );
    });
  });
});
