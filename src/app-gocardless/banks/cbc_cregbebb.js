import Fallback from './integration-bank.js';

/**
 * The remittance information contains creditorName, payments method, dates, etc.
 * This function makes sure to only extract the creditorName based on the different indicators like "Paiement".
 * f.e. ONKART FR Viry Paiement Maestro par Carte de débit CBC 05-09-2024 à 15.43 heures 6703 19XX XXXX X... -> ONKART FR Viry
 */
function extractPayeeName(remittanceInformationUnstructured) {
  const indices = [
    remittanceInformationUnstructured.lastIndexOf(' Paiement'),
    remittanceInformationUnstructured.lastIndexOf(' Domiciliation'),
    remittanceInformationUnstructured.lastIndexOf(' Transfert'),
    remittanceInformationUnstructured.lastIndexOf(' Ordre permanent'),
  ];

  const indexForRemoval = Math.max(...indices);

  return indexForRemoval > -1
    ? remittanceInformationUnstructured.substring(0, indexForRemoval)
    : remittanceInformationUnstructured;
}

/** @type {import('./bank.interface.js').IBank} */
export default {
  ...Fallback,

  institutionIds: ['CBC_CREGBEBB'],

  /**
   * For negative amounts, the only payee information we have is returned in
   * remittanceInformationUnstructured.
   */
  normalizeTransaction(transaction, _booked) {
    if (Number(transaction.transactionAmount.amount) > 0) {
      return {
        ...transaction,
        payeeName:
          transaction.debtorName ||
          transaction.remittanceInformationUnstructured,
        date: transaction.bookingDate || transaction.valueDate,
      };
    }

    return {
      ...transaction,
      payeeName:
        transaction.creditorName ||
        extractPayeeName(transaction.remittanceInformationUnstructured),
      date: transaction.bookingDate || transaction.valueDate,
    };
  },
};
