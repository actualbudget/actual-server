const { printIban, amountToInteger } = require('../utils');
const IntegrationBank = require('./integration-bank');

class SandboxfinanceSfin0000 extends IntegrationBank {
  static institutionId = 'SANDBOXFINANCE_SFIN0000';

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
      name: [account.name, printIban(account)].join(' '),
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
      const [aTime, aSeq] = a.transactionId.split('-');
      const [bTime, bSeq] = b.transactionId.split('-');

      return Number(bTime) - Number(aTime) || Number(bSeq) - Number(aSeq);
    });
  };

  /**
   *  Nordigen docs: https://nordigen.com/en/docs/account-information/output/balance/
   *  For SANDBOXFINANCE_SFIN0000 we don't know what balance was
   *  after each transaction so we have to calculate it by getting
   *  current balance from the account and subtract all the transactions
   *
   *  As a current balance we use `interimBooked` balance type because
   *  it includes transaction placed during current day
   */
  calculateStartingBalance = (sortedTransactions = [], balances = []) => {
    const currentBalance = balances.find(
      (balance) => 'interimAvailable' === balance.balanceType
    );

    return sortedTransactions.reduce((total, trans) => {
      return total - amountToInteger(trans.transactionAmount.amount);
    }, amountToInteger(currentBalance.balanceAmount.amount));
  };
}

module.exports = SandboxfinanceSfin0000;
