import defaultBank from './integration-bank.js';

/** @type {import('./bank.interface.js').IBank} */
export default {
  ...defaultBank,
  institutionIds: ['ASN_BANK_ASNBNL21'],

  normalizeTransaction(transaction) {
    const normalized = defaultBank.normalizeTransaction(transaction);

    if (!normalized) {
      return normalized;
    }

    return {
      ...normalized,

      // Sometimes the `transactionId` field is just a space char;
      // in such cases we want to trim it (i.e. make it truly empty)
      // so that actual-web does not perform transaction matching
      // based on the whitespace transaction id
      transactionId: normalized.transactionId.trim(),
    };
  },
};
