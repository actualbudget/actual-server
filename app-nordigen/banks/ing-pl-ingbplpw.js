const { printIban, amountToInteger } = require('../utils');
const IntegrationBank = require('./integration-bank');

class IngPlIngbplpw extends IntegrationBank {
  static institutionId = 'ING_PL_INGBPLPW';

  /**
   * Returns normalized object with required data for the frontend
   * @param {DetailedAccount&{institution: Institution}} account
   * @returns {NormalizedAccountDetails}
   */
  normalizeAccount = (account) => {
    return {
      account_id: account.id,
      institution: account.institution,
      mask: account.iban.slice(-4),
      name: [account.product, printIban(account)].join(' ').trim(),
      official_name: account.product,
      type: 'checking'
    };
  };

  /**
   * Function sorts an array of transactions from newest to oldest
   * @param {Array<Transaction>} transactions
   * @returns {Array<Transaction>}
   */
  sortTransactions = (transactions = []) => {
    return transactions.sort((a, b) => {
      return (
        Number(b.transactionId.substr(2)) - Number(a.transactionId.substr(2))
      );
    });
  };

  calculateStartingBalance = (sortedTransactions = [], balances = []) => {
    if (sortedTransactions.length) {
      const oldestTransaction =
        sortedTransactions[sortedTransactions.length - 1];
      const oldestKnownBalance = amountToInteger(
        oldestTransaction.balanceAfterTransaction.balanceAmount.amount
      );
      const oldestTransactionAmount = amountToInteger(
        oldestTransaction.transactionAmount.amount
      );

      return oldestKnownBalance - oldestTransactionAmount;
    } else {
      return amountToInteger(
        balances.find((balance) => 'interimBooked' === balance.balanceType)
          .balanceAmount.amount
      );
    }
  };
}
module.exports = IngPlIngbplpw;
