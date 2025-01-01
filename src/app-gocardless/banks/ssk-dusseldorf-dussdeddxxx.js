import Fallback from './integration-bank.js';

import { formatPayeeName } from '../../util/payee-name.js';

/** @type {import('./bank.interface.js').IBank} */
export default {
  ...Fallback,

  institutionIds: ['SSK_DUSSELDORF_DUSSDEDDXXX'],

  accessValidForDays: 90,

  /**
   * Following the GoCardless documentation[0] we should prefer `bookingDate`
   * here, though some of their bank integrations uses the date field
   * differently from what's described in their documentation and so it's
   * sometimes necessary to use `valueDate` instead.
   *
   *   [0]: https://nordigen.zendesk.com/hc/en-gb/articles/7899367372829-valueDate-and-bookingDate-for-transactions
   */
  normalizeTransaction(transaction, _booked) {
    const date = transaction.bookingDate || transaction.valueDate;
    if (!date) {
      return null;
    }

    let remittanceInformationUnstructured;

    remittanceInformationUnstructured =
      transaction.remittanceInformationUnstructured ??
      transaction.remittanceInformationStructured ??
      transaction.remittanceInformationStructuredArray?.join(' ');
    
    if (transaction.additionalInformation)
      remittanceInformationUnstructured +=
        ' ' + transaction.additionalInformation;

    const usefulCreditorName =
      transaction.ultimateCreditor ||
      transaction.creditorName ||
      transaction.debtorName;
    
    transaction.creditorName = usefulCreditorName;
    transaction.remittanceInformationUnstructured =
      remittanceInformationUnstructured;
    
    return {
      ...transaction,
      payeeName: formatPayeeName(transaction),
      date: transaction.bookingDate || transaction.valueDate,
    };
  },
};
