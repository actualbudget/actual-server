import Fallback from './integration-bank.js';
import { printIban } from '../utils.js';
import * as d from 'date-fns';

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
    const dateFormat = "yyyy-MM-dd-HH.mm.ss.SSSSSS'Z'";
    return transactions.sort((a, b) => {
      const dateA = d.parse(a.transactionId, dateFormat, new Date());
      const dateB = d.parse(b.transactionId, dateFormat, new Date());
      return d.compareAsc(dateA, dateB);
    });
  },
};
