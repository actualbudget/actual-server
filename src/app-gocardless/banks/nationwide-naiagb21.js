import Fallback from './integration-bank.js';

/** @type {import('./bank.interface.js').IBank} */
export default {
  institutionIds: ['NATIONWIDE_NAIAGB21'],

  accessValidForDays: 90,

  normalizeAccount(account) {
    return Fallback.normalizeAccount(account);
  },

  normalizeTransaction(transaction, booked) {
    // Nationwide returns pending transactions with a date representing
    // the latest a transaction could be booked. This stops actual's
    // deduplication logic from working as it only checks 7 days ahead/behind
    // and the transactionID from Nationwide changes when a transaction is
    // booked
    if (!booked) {
      const d = new Date(transaction.bookingDate)
      d.setDate(d.getDate() - 8);

      const useDate = new Date(Math.min(d.getTime(), new Date().getTime()));

      transaction.bookingDate = useDate.toISOString().slice(0, 10);
    }

    // Nationwide also occasionally returns erroneous transaction_ids
    // that are malformed and can even change after import. This will ignore
    // these ids and unset them. When a correct ID is returned then it will
    // update via the deduplication logic
    const debitCreditRegex = /^00(DEB|CRED)IT.+$/
    if (transaction.transactionId?.match(debitCreditRegex) || transaction.transactionId?.length !== 40) {
      transaction.transactionId = null;
    }

    return Fallback.normalizeTransaction(transaction, booked);
  },

  sortTransactions(transactions = []) {
    return Fallback.sortTransactions(transactions);
  },

  calculateStartingBalance(sortedTransactions = [], balances = []) {
    return Fallback.calculateStartingBalance(sortedTransactions, balances);
  },
};
