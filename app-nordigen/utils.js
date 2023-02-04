const printIban = (account) => {
  if (account.iban) {
    return '(XXX ' + account.iban.slice(-4) + ')';
  } else {
    return '';
  }
};

const amountToInteger = (n) => Math.round(n * 100);

module.exports = { printIban, amountToInteger };
