import Fallback from './integration-bank.js';

/** @type {import('./bank.interface.js').IBank} */
export default {
  institutionIds: ['ABANCA_CAGLESMM'],

  accessValidForDays: 180,

  normalizeAccount(account) {
    return Fallback.normalizeAccount(account);
  },

  // Abanca transactions doesn't get the creditorName/debtorName properly
  normalizeTransaction(transaction, _booked) {
    return {
      ...transaction,
      creditorName: transaction.remittanceInformationStructured,
      debtorName: transaction.remittanceInformationStructured,
      date: transaction.bookingDate || transaction.valueDate,
    };
  },

  sortTransactions(transactions = []) {
    return Fallback.sortTransactions(transactions);
  },

  calculateStartingBalance(sortedTransactions = [], balances = []) {
    return Fallback.calculateStartingBalance(sortedTransactions, balances);
  },
};
