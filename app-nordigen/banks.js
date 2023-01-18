// --- BEGIN utils
const printIban = (account) => {
  if (account.iban) {
    return '(XXX ' + account.iban.slice(-4) + ')';
  } else {
    return '';
  }
};
//--- END utils

class MbankRetailBrexplpw{
  static institutionId = 'MBANK_RETAIL_BREXPLPW';

  constructor(options) {
  }

  /**
   * Returns normalized object with required data for the frontend
   * @param {DetailedAccount&{institution: Institution}} account
   * @returns {NormalizedAccountDetails}
   */
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

class SandboxfinanceSfin0000 {
  static institutionId = 'SANDBOXFINANCE_SFIN0000';

  constructor(options) {
  }

  /**
   * Returns normalized object with required data for the frontend
   * @param {DetailedAccount&{institution: Institution}} account
   * @returns {NormalizedAccountDetails}
   */
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

class IngPlIngbplpw {
  static institutionId = 'ING_PL_INGBPLPW';

  /**
   * Returns normalized object with required data for the frontend
   * @param {DetailedAccount&{institution: Institution}} account
   * @returns {NormalizedAccountDetails}
   */
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

class IntegrationBank {
  /**
   * Returns normalized object with required data for the frontend
   * @param {DetailedAccount&{institution: Institution}} account
   * @returns {NormalizedAccountDetails}
   */
  normalizeAccount = (account) => {
    console.log(
      'Available account properties for new institution integration',
      { account: JSON.stringify(account) }
    );
    return {
      account_id: account.id,
      institution: account.institution,
      mask: (account?.iban || '0000').slice(-4),
      name: `integration-${account.institution_id}`,
      official_name: `integration-${account.institution_id}`,
      type: 'checking'
    }
  }
}

const BankFactory = (institutionId) => {
  switch (institutionId) {
    // case MbankRetailBrexplpw.institutionId:
    //   return new MbankRetailBrexplpw()
    case SandboxfinanceSfin0000.institutionId:
      return new SandboxfinanceSfin0000()
    case IngPlIngbplpw.institutionId:
      return new IngPlIngbplpw();
    default:
      return new IntegrationBank();
  }
}

module.exports = BankFactory
