// --- BEGIN utils
const printIban = (account) => {
  if (account.iban) {
    return '(XXX ' + account.iban.slice(-4) + ')';
  } else {
    return '';
  }
};
//--- END utils


// https://nordigen.com/en/docs/account-information/output/accounts/
// https://docs.google.com/spreadsheets/d/1ogpzydzotOltbssrc3IQ8rhBLlIZbQgm5QCiiNJrkyA/edit#gid=489769432

class MBankRetail{
  static institutionId = 'MBANK_RETAIL_BREXPLPW';

  constructor(options) {
  }

  normalizeAccount = (account) => {
    return {
      account_id: account.id,
      institution: account.institution,
      mask: account.iban.slice(-4),
      name: [account.displayName, printIban(account)].join(' '),
      official_name: account.product,
      type: 'checking'
    }
  }
}

class SandboxFinance {
  static institutionId = 'SANDBOXFINANCE_SFIN0000';

  constructor(options) {
  }

  normalizeAccount = (account) => {
    return {
      account_id: account.id,
      institution: account.institution,
      mask: account.iban.slice(-4),
      name: [account.name, printIban(account)].join(' '),
      official_name: account.product,
      type: 'checking'
    }
  }
}

class IngPl {
  static institutionId = 'ING_PL_INGBPLPW';

  constructor(options) {
  }

  normalizeAccount = (account) => {
    return {
      account_id: account.id,
      institution: account.institution,
      mask: account.iban.slice(-4),
      name: [account.product, printIban(account)].join(' '),
      official_name: account.product,
      type: 'checking'
    }
  }
}

const BankFactory = (bankId) => {
  switch (bankId) {
    case MBankRetail.institutionId:
      return new MBankRetail()
    case SandboxFinance.institutionId:
      return new SandboxFinance()
    case IngPl.institutionId:
      return new IngPl();
    default:
      throw new Error('error');
  }
}

module.exports = BankFactory
