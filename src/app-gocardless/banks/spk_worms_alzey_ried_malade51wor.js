import Fallback from './integration-bank.js';

import { printIban, amountToInteger } from '../utils.js';
import { formatPayeeName } from '../../util/payee-name.js';

/** @type {import('./bank.interface.js').IBank} */
export default {
  ...Fallback,

  institutionIds: ['SPK_WORMS_ALZEY_RIED_MALADE51WOR'],

  accessValidForDays: 90,

  normalizeAccount(account) {
    return {
      account_id: account.id,
      institution: account.institution,
      mask: account.iban.slice(-4),
      iban: account.iban,
      name: [account.name, printIban(account)].join(' '),
      official_name: account.product,
      type: 'checking',
    };
  },

  normalizeTransaction(transaction, _booked) {
    const date = transaction.bookingDate || transaction.valueDate;
    if (!date) {
      return null;
    }

    transaction.remittanceInformationUnstructured =
      transaction.remittanceInformationUnstructured ??
      transaction.remittanceInformationStructured ??
      transaction.remittanceInformationStructuredArray?.join(' ');
    return {
      ...transaction,
      payeeName: formatPayeeName(transaction),
      date: transaction.bookingDate || transaction.valueDate,
    };
  },

  calculateStartingBalance(sortedTransactions = [], balances = []) {
    const currentBalance = balances.find(
      (balance) => 'interimAvailable' === balance.balanceType,
    );

    return sortedTransactions.reduce((total, trans) => {
      return total - amountToInteger(trans.transactionAmount.amount);
    }, amountToInteger(currentBalance.balanceAmount.amount));
  },
};
