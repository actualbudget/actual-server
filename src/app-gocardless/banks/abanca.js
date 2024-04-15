import Fallback from './integration-bank.js';

/** @type {import('./bank.interface.js').IBank} */
export default {
  institutionIds: ['ABANCA_CAGLESMM'],

  normalizeAccount(account) {
    return Fallback.normalizeAccount(account);
  },

  // Abanca transactions doesn't get the creditorID properly
  normalizeTransaction(transaction, _booked) {
    return {
      ...transaction,
      creditorName: transaction.remittanceInformationStructured,
    };
  },

  sortTransactions(transactions = []) {
    return Fallback.sortTransactions(transactions);
  },

  calculateStartingBalance(sortedTransactions = [], balances = []) {
    return Fallback.calculateStartingBalance(sortedTransactions, balances);
  },
};
