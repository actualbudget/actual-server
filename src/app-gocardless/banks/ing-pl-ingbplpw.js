import { printIban, amountToInteger } from '../utils.js';

/** @type {import('./bank.interface.js').IBank} */
export default {
  institutionIds: ['ING_PL_INGBPLPW'],

  normalizeAccount(account) {
    return {
      account_id: account.id,
      institution: account.institution,
      mask: account.iban.slice(-4),
      iban: account.iban,
      name: [account.product, printIban(account)].join(' ').trim(),
      official_name: account.product,
      type: 'checking',
    };
  },

  normalizeTransaction(transaction, _booked) {
    return {
      ...transaction,
      date: transaction.bookingDate || transaction.valueDate,
    };
  },

  sortTransactions(transactions = []) {
    return transactions.sort((a, b) => {
      return (
        Number(b.transactionId.substr(2)) - Number(a.transactionId.substr(2))
      );
    });
  },

  calculateStartingBalance(sortedTransactions = [], balances = []) {
    if (sortedTransactions.length) {
      const oldestTransaction =
        sortedTransactions[sortedTransactions.length - 1];
      const oldestKnownBalance = amountToInteger(
        oldestTransaction.balanceAfterTransaction.balanceAmount.amount,
      );
      const oldestTransactionAmount = amountToInteger(
        oldestTransaction.transactionAmount.amount,
      );

      return oldestKnownBalance - oldestTransactionAmount;
    } else {
      return amountToInteger(
        balances.find((balance) => 'interimBooked' === balance.balanceType)
          .balanceAmount.amount,
      );
    }
  },
};
