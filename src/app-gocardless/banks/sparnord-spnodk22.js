import Fallback from './integration-bank.js';

/** @type {import('./bank.interface.js').IBank} */
export default {
  institutionIds: [
    'SPARNORD_SPNODK22',
    'LAGERNES_BANK_LAPNDKK1',
    'ANDELSKASSEN_FALLESKASSEN_FAELDKK1',
  ],

  accessValidForDays: 180,

  normalizeAccount(account) {
    return Fallback.normalizeAccount(account);
  },

  /**
   * Banks on the BEC backend only give information regarding the transaction in additionalInformation
   */
  normalizeTransaction(transaction, _booked) {
    return {
      ...transaction,
      date: transaction.bookingDate,
      remittanceInformationUnstructured: transaction.additionalInformation,
    };
  },

  sortTransactions(transactions = []) {
    return Fallback.sortTransactions(transactions);
  },

  calculateStartingBalance(sortedTransactions = [], balances = []) {
    return Fallback.calculateStartingBalance(sortedTransactions, balances);
  },
};
