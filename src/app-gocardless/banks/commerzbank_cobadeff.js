import Fallback from './integration-bank.js';
import { amountToInteger, printIban } from '../utils.js';
import { formatPayeeName } from '../../util/payee-name.js';

/** @type {import('./bank.interface.js').IBank} */
export default {
  ...Fallback,

  institutionIds: ['COMMERZBANK_COBADEFF'],

  accessValidForDays: 179,

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
    // remittanceInformationUnstructured is limited to 140 chars thus ...
    // ... missing information form remittanceInformationUnstructuredArray ...
    // ... so we recreate it.
    transaction.remittanceInformationUnstructured =
      transaction.remittanceInformationUnstructuredArray.join(' ');

    // The limitations of remittanceInformationUnstructuredArray ...
    // ... can result in split keywords. We fix these. Other ...
    // ... splits will need to be fixed by user with rules.
    const keywords = [
      'End-to-End-Ref.:',
      'Mandatsref:',
      'Gläubiger-ID:',
      'SEPA-BASISLASTSCHRIFT',
      'Kartenzahlung',
      'Dauerauftrag',
    ];
    keywords.forEach((keyword) => {
      transaction.remittanceInformationUnstructured =
        transaction.remittanceInformationUnstructured.replace(
          RegExp(keyword.split('').join('\\s*'), 'gi'),
          ', ' + keyword + ' ',
        );
    });

    // Clean up remittanceInformation, deduplicate payee (removing slashes ...
    // ... that are added to the remittanceInformation field), and ...
    // ... remove clutter like "End-to-End-Ref.: NOTPROVIDED"
    const payee = transaction.creditorName || transaction.debtorName || '';
    transaction.remittanceInformationUnstructured =
      transaction.remittanceInformationUnstructured
        .replace(/\s*(,)?\s+/g, '$1 ')
        .replace(RegExp(payee.split(' ').join('(/*| )'), 'gi'), ' ')
        .replace(', End-to-End-Ref.: NOTPROVIDED', '')
        .trim();

    return {
      ...transaction,
      payeeName: formatPayeeName(transaction),
      date: transaction.bookingDate,
    };
  },

  /**
   *  For COMMERZBANK_COBADEFF we don't know what balance was
   *  after each transaction so we have to calculate it by getting
   *  current balance from the account and subtract all the transactions
   *
   *  As a current balance we use `expected` balance type because it
   *  corresponds to the current running balance, whereas `interimAvailable`
   *  holds the remaining credit limit.
   */
  calculateStartingBalance(sortedTransactions = [], balances = []) {
    const currentBalance = balances.find(
      (balance) => 'expected' === balance.balanceType,
    );

    return sortedTransactions.reduce((total, trans) => {
      return total - amountToInteger(trans.transactionAmount.amount);
    }, amountToInteger(currentBalance.balanceAmount.amount));
  },
};
