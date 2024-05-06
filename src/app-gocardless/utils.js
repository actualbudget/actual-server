import { title } from './util/title/index.js';

function formatPayeeIban(iban) {
  return '(' + iban.slice(0, 4) + ' XXX ' + iban.slice(-4) + ')';
}

export const printIban = (account) => {
  if (account.iban) {
    return '(XXX ' + account.iban.slice(-4) + ')';
  } else {
    return '';
  }
};

export const sortByBookingDateOrValueDate = (transactions = []) =>
  transactions.sort(
    (a, b) =>
      +new Date(b.bookingDate || b.valueDate) -
      +new Date(a.bookingDate || a.valueDate),
  );

export const amountToInteger = (n) => Math.round(n * 100);

export const formatPayeeName = (trans) => {
  const nameParts = [];

  const name =
    trans.debtorName ||
    trans.creditorName ||
    trans.remittanceInformationUnstructured ||
    (trans.remittanceInformationUnstructuredArray || []).join(', ') ||
    trans.additionalInformation;

  if (name) {
    nameParts.push(title(name));
  }

  if (trans.debtorAccount && trans.debtorAccount.iban) {
    nameParts.push(formatPayeeIban(trans.debtorAccount.iban));
  } else if (trans.creditorAccount && trans.creditorAccount.iban) {
    nameParts.push(formatPayeeIban(trans.creditorAccount.iban));
  }

  return nameParts.join(' ');
};
