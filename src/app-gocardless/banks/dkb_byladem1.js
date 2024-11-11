import Fallback from './integration-bank.js';
import { printIban } from '../utils.js';

/** @type {import('./bank.interface.js').IBank} */
export default {
  ...Fallback,

  accessValidForDays: 180,

  institutionIds: ['DKB_BYLADEM1'],

  normalizeAccount(account) {
    return {
      account_id: account.id,
      institution: account.institution,
      mask: account.iban.slice(-4),
      iban: account.iban,
      name: [account.product, printIban(account)].join(' '),
      official_name: account.product,
      type: 'checking',
    };
  },

  sortTransactions(transactions = []) {
    return transactions.sort((a, b) => {
      const dateA = transactionIdToDate(a.transactionId);
      const dateB = transactionIdToDate(b.transactionId);
      return +dateB - +dateA;
    });
  },
};

/**
 * Takes a transactionId string and converts it into a `Date`.
 *
 * @param {string} transactionId The transactionId in the format `YYYY-MM-DD-HH.MM.SS.NNNNNN`.
 * @returns {Date} The `Date` representation of the given `transactionId`
 */
function transactionIdToDate(transactionId) {
  const datePart = /\d{4}-\d{2}-\d{2}/.exec(transactionId)[0];
  const timePart = /\d{2}\.\d{2}\.\d{2}/
    .exec(transactionId)[0]
    .replaceAll('.', ':');
  const dateTimeString = [datePart, timePart].join(' ');
  return new Date(dateTimeString);
}
