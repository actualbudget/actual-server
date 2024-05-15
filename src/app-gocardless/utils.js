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

  // get the correct name and account fields for the transaction amount
  let name;
  let account;
  if (trans.amount > 0 || Object.is(Number(trans.amount), 0)) {
    name = trans.debtorName;
    account = trans.debtorAccount;
  } else {
    name = trans.creditorName;
    account = trans.creditorAccount;
  }

  // use the correct fields for the amount if it was found
  // if not, use whatever we can find
  name =
    name ||
    trans.debtorName ||
    trans.creditorName ||
    trans.remittanceInformationUnstructured ||
    (trans.remittanceInformationUnstructuredArray || []).join(', ') ||
    trans.additionalInformation;

  account = account || trans.debtorAccount || trans.creditorAccount;

  if (name) {
    nameParts.push(title(name));
  }

  if (account && account.iban) {
    nameParts.push(formatPayeeIban(account.iban));
  }

  return nameParts.join(' ');
};
