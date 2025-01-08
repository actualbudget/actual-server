import Fallback from './integration-bank.js';

/** @type {import('./bank.interface.js').IBank} */
export default {
  ...Fallback,

  institutionIds: ['LHV_LHVBEE22'],

  accessValidForDays: 90,

  normalizeTransaction(transaction, booked) {
    // extract bookingDate and creditorName for card transactions, e.g.
    // (..1234) 2025-01-02 09:32 CrustumOU\Poordi 3\Tallinn\10156     ESTEST
    // bookingDate: 2025-01-02
    // creditorName: CrustumOU
    const cardTxRegex =
      /^\(\.\.(\d{4})\) (\d{4}-\d{2}-\d{2}) (\d{2}:\d{2}) (.+)$/g;
    const cardTxMatch = cardTxRegex.exec(
      transaction?.remittanceInformationUnstructured,
    );

    if (cardTxMatch) {
      transaction = {
        ...transaction,
        creditorName: cardTxMatch[4].split('\\')[0].trim(),
      };

      if (booked) {
        transaction = {
          ...transaction,
          bookingDate: cardTxMatch[2],
        };
      }
    }

    return Fallback.normalizeTransaction(transaction, booked);
  },
};
