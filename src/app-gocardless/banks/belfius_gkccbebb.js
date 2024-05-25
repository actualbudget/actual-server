import Fallback from './integration-bank.js';
import { formatPayeeName } from '../utils.js';

/** @type {import('./bank.interface.js').IBank} */
export default {
  institutionIds: ['BELFIUS_GKCCBEBB'],

  accessValidForDays: 180,

  normalizeAccount(account) {
    return Fallback.normalizeAccount(account);
  },

  // The problem is that we have transaction with duplicated transaction ids.
  // This is not expected and the nordigen api has a work-around for some backs
  // They will set an internalTransactionId which is unique
  normalizeTransaction(transaction, _booked) {
    return {
      ...transaction,
      transactionId: transaction.internalTransactionId,
      date: transaction.bookingDate || transaction.valueDate,
      payeeName: formatPayeeName(transaction),
    };
  },

  sortTransactions(transactions = []) {
    return Fallback.sortTransactions(transactions);
  },

  calculateStartingBalance(sortedTransactions = [], balances = []) {
    return Fallback.calculateStartingBalance(sortedTransactions, balances);
  },
};
