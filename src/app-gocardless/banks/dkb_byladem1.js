import Fallback from './integration-bank.js';

/** @type {import('./bank.interface.js').IBank} */
export default {
  ...Fallback,

  institutionIds: ['DKB_BYLADEM1'],

  accessValidForDays: 180,

  sortTransactions: (transactions = []) => {

  },

  normalizeTransaction: (transaction, _booked) => {

  },

  normalizeAccount: (account) => {

  }
}
