import Fallback from './integration-bank.js';
import { amountToInteger } from '../utils.js';

/** @type {import('./bank.interface.js').IBank} */
export default {
  ...Fallback,

  institutionIds: ['ING_INGBROBU'],

  accessValidForDays: 180,

  normalizeTransaction(transaction, booked) {
    //Merchant transactions all have the same transactionId of 'NOTPROVIDED'.
    //For booked transactions, this can be set to the internalTransactionId
    //For pending transactions, this needs to be removed for them to show up in Actual

    //For deduplication to work, payeeName needs to be standardized.
    //And converted from a pending transaction form ("payeeName":"Card no: xxxxxxxxxxxx1111"') to a booked transaction form ("payeeName":"Card no: Xxxx Xxxx Xxxx 1111")
    if (transaction.transactionId === "NOTPROVIDED") {
      if (booked) {
       transaction.transactionId = transaction.internalTransactionId;

        if (transaction.remittanceInformationUnstructured.toLowerCase().includes('card no:')) {
          transaction.creditorName = transaction.remittanceInformationUnstructured.split(',')[0];
        }
      }

      else {
        transaction.transactionId = null;
        if (transaction.remittanceInformationUnstructured.toLowerCase().includes('card no:')) {
          transaction.creditorName = transaction.remittanceInformationUnstructured.replace(/x{4}/g, 'Xxxx ');
        }
      }
    } 

    return Fallback.normalizeTransaction(transaction, booked);
  },

  calculateStartingBalance(sortedTransactions = [], balances = []) {
    const currentBalance = balances.find(
      (balance) => 'expected' === balance.balanceType.toString(),
    );

    return sortedTransactions.reduce((total, trans) => {
      return total - amountToInteger(trans.transactionAmount.amount);
    }, amountToInteger(currentBalance.balanceAmount.amount));
  },
};
