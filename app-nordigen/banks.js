/**
 * @typedef {Object} Requisition
 * @property {string} status
 * @property {Array<string>} accounts - Array of lined account ids
 * @property {string} id
 * @property {string} created "2023-01-10T16:31:50.229Z",
 * @property {string} redirect "string",
 * @property {string} institution_id "string",
 * @property {string} agreement "3fa85f64-5717-4562-b3fc-2c963f66afa6",
 * @property {string} reference "string",
 * @property {string} user_language "strin",
 * @property {string} link "https://ob.nordigen.com/psd2/start/3fa85f64-5717-4562-b3fc-2c963f66afa6/{$INSTITUTION_ID}",
 * @property {string} ssn "string",
 * @property {string} account_selection false,
 * @property {string} redirect_immediate false
 */

// https://nordigen.com/en/docs/account-information/output/accounts/
// https://docs.google.com/spreadsheets/d/1ogpzydzotOltbssrc3IQ8rhBLlIZbQgm5QCiiNJrkyA/edit#gid=489769432
/**
 * @typedef {Object} NordigenAccountDetails
 * @property {string} resourceId
 * @property {string} [bban] This data element is used for payment accounts which have no IBAN
 * @property {string} [bic] The BIC associated to the account.
 * @property {string} [cashAccountType] ExternalCashAccountType1Code from ISO 20022
 * @property {string} currency Account currency
 * @property {string} [details] Specifications that might be provided by the financial institution:
 * - characteristics of the account,
 * - characteristics of the relevant card
 * @property {string} [displayName] Name of the account as defined by the end user within online channels
 * @property {string} [iban] iban
 * @property {string} [linkedAccounts] This data attribute is a field, where an financial institution can name a cash account associated to pending card transactions.
 * @property {string} [msisdn] An alias to a payment account via a registered mobile phone number
 * @property {string} [name] Name of the account, as assigned by the financial institution
 * @property {Array<string>} [ownerAddressUnstructured] Address of the legal account owner
 * @property {string} [ownerName] Name of the legal account owner. If there is more than one owner, then e.g. two names might be noted here. For a corporate account, the corporate name is used for this attribute.
 * @property {string} [product] Product Name of the Bank for this account, proprietary definition
 * @property {string} [resourceId] The account id of the given account in the financial institution
 * @property {string} [status] Account status. The value is one of the following:
 * "enabled": account is available
 * "deleted": account is terminated
 * "blocked": account is blocked e.g. for legal reasons
 *
 * If this field is not used, then the account is available in the sense of this specification.
 * @property {string} [usage] Specifies the usage of the account
 * PRIV: private personal account
 * ORGA: professional account
 */


/**
 * @typedef {Object} NordigenAccountMetadata
 * @property {string} id
 * @property {string} created
 * @property {string} last_accessed
 * @property {string} iban
 * @property {string} institution_id
 * @property {string} status DISCOVERED -> "User has successfully authenticated and account is discovered", "PROCESSING" -> "Account is being processed by the Institution", "ERROR" -> "An error was encountered when processing account", "EXPIRED" -> "Access to account has expired as set in End User Agreement", "READY" -> "Account has been successfully processed", "SUSPENDED" -> "Account has been suspended (more than 10 consecutive failed attempts to access the account)"
 * @property {string} owner_name
 */

/**
 * @typedef {NordigenAccountDetails & NordigenAccountMetadata} DetailedAccount
 */

/**
 * @typedef {Object} Institution
 * @property {string} id example: "N26_NTSBDEB1",
 * @property {string} name example: "N26 Bank",
 * @property {string} bic example: "NTSBDEB1",
 * @property {string} transaction_total_days example: "90",
 * @property {Array<string>} countries example: ["PL"]
 * @property {string} logo example: "https://cdn.nordigen.com/ais/N26_SANDBOX_NTSBDEB1.png"
 * }
 */

/**
 * @typedef {Object} NormalizedAccountDetails
 * @property {string} account_id Id of the account
 * @property {Institution} institution object of Institution
 * @property {string} mask last 4 digits from the account iban
 * @property {string} name name of the accounts
 * @property {string} official_name name of the product in the institution
 * @property {string} type type of account
 */

/**
 * @typedef Amount
 * @property {number} amount
 * @property {string} currency
 */

// https://nordigen.com/en/docs/account-information/output/transactions/
/**
 * @typedef Transaction
 * @property {string} [additionalInformation] Might be used by the financial institution to transport additional transaction related information
 * @property {string} [additionalInformation] Is used if and only if the bookingStatus entry equals "information"
 * @property {number} [balanceAfterTransaction] This is the balance after this transaction. Recommended balance type is interimBooked.
 * @property {string} [bankTransactionCode] Bank transaction code as used by the financial institution and using the sub elements of this structured code defined by ISO20022. For standing order reports the following codes are applicable:
 * "PMNT-ICDT-STDO" for credit transfers,
 * "PMNT-IRCT-STDO" for instant credit transfers,
 * "PMNT-ICDT-XBST" for cross-border credit transfers,
 * "PMNT-IRCT-XBST" for cross-border real time credit transfers,
 * "PMNT-MCOP-OTHR" for specific standing orders which have a dynamical amount to move left funds e.g. on month end to a saving account
 * @property {string} [bookingDate] The date when an entry is posted to an account on the financial institutions books.
 * @property {string} [bookingDateTime] The date and time when an entry is posted to an account on the financial institutions books.
 * @property {string} [checkId] Identification of a Cheque
 * @property {string} [creditorAccount] Account Reference  Conditional
 * @property {string} [creditorAgent] BICFI
 * @property {string} [creditorId] Identification of Creditors, e.g. a SEPA Creditor ID
 * @property {string} [creditorName] Name of the creditor if a "Debited" transaction
 * @property {Array<any>} [currencyExchange] Array of Report [Exchange] Rate
 * @property {string} [debtorAccount] Account Reference  Conditional
 * @property {string} [debtorAgent] BICFI
 * @property {string} [debtorName] Name of the debtor if a "Credited" transaction
 * @property {string} [endToEndId] Unique end to end ID
 * @property {string} [entryReference] Is the identification of the transaction as used for reference given by financial institution.
 * @property {string} [internalTransactionId] Transaction identifier given by Nordigen
 * @property {string} [mandateId] Identification of Mandates, e.g. a SEPA Mandate ID
 * @property {string} [merchantCategoryCode] Merchant category code as defined by card issuer
 * @property {string} [proprietaryBank] Proprietary bank transaction code as used within a community or within an financial institution
 * @property {Object} [purposeCode] Conditional
 * @property {string} [remittanceInformation] Reference as contained in the structured remittance reference structure
 * @property {Array<any>} [remittanceInformation] Reference as contained in the structured remittance reference structure
 * @property {string} [remittanceInformation]
 * @property {string} [remittanceInformation]
 * @property {Amount} transactionAmount The amount of the transaction as billed to the account, an object containing:
 * @property {string} [transactionId] Unique transaction identifier given by financial institution
 * @property {string} [ultimateCreditor]
 * @property {string} [ultimateDebtor]
 * @property {string} [valueDate] The Date at which assets become available to the account owner in case of a credit
 * @property {string} [valueDateTime] The date and time at which assets become available to the account owner in case of a credit
 *
 */

/**
 * @typedef Transactions
 * @property {Array<Transaction>} booked
 * @property {Array<Transaction>} pending
 */

/**
 * @typedef {Object} GetTransactionsParams
 * @property {string} accountId Id of account from the nordigen app
 * @property {string} startDate Begin date of the period from which we want to download transactions
 * @property {string} endDate End date of the period from which we want to download transactions
 */

/**
 * @typedef {Object} GetTransactionsResponse
 * @property {number} [status_code]
 * @property {string} [detail]
 * @property {Transactions} transactions
 */

// --- BEGIN utils
const printIban = (account) => {
  if (account.iban) {
    return '(XXX ' + account.iban.slice(-4) + ')';
  } else {
    return '';
  }
};
const amountToInteger = (n) => Math.round(n * 100);

//--- END utils

class MbankRetailBrexplpw {
  static institutionId = 'MBANK_RETAIL_BREXPLPW';

  constructor(options) {
  }

  /**
   * Returns normalized object with required data required by frontend
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

  /**
   * Sort transactions from newest (first element of the array) to oldest (last elements of the array)
   * @param {Array<Transaction>} transactions
   * @returns {Array<Transaction>}
   */
  sortTransactions = (transactions = []) => {
    return transactions.sort((a, b) => Number(b.transactionId) - Number(a.transactionId));
  }

  // https://nordigen.com/en/docs/account-information/output/balance/
  /**
   * Amount of balance before all provided transactions. It's required to add initial transaction with "Starting balance"
   *
   * @param {Array<Transaction>} sortedTransactions an array of transactions in order from newest (first element of the array) to oldest (last elements of the array)
   * @param balances Each bank have could have different balance types available.
   *   list and description of the possible balance types you can find here - https://nordigen.com/en/docs/account-information/output/balance/
   *
   *    For MBANK_RETAIL_BREXPLPW we don't know what balance was
   *    after each transaction so we have to calculate it by getting
   *    current balance from the account and subtract all the transactions
   *
   *    As a current balance we use `interimBooked` balance type because
   *    it includes transaction placed during current day
   * @returns {number} Amount in "cents" of balance before all provided transactions
   */
  calculateStartingBalance = (sortedTransactions = [], balances = []) => {
    const currentBalance = balances.find((balance) => 'interimBooked' === balance.balanceType)

    return sortedTransactions.reduce((total, trans) => {
      return total - amountToInteger(trans.transactionAmount.amount);
    }, amountToInteger(currentBalance.balanceAmount.amount));
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
    console.log(
      'Available account properties for new institution integration',
      {account: JSON.stringify(account)}
    );
    return {
      account_id: account.id,
      institution: account.institution,
      mask: account.iban.slice(-4),
      name: [account.name, printIban(account)].join(' '),
      official_name: account.product,
      type: 'checking'
    }
  }

  /**
   * Sort transactions from newest (first element of the array) to oldest (last elements of the array)
   * @param {Array<Transaction>} transactions
   * @returns {Array<Transaction>}
   */
  sortTransactions = (transactions = []) => {
    console.log(
      'Available (first 10) transactions properties for new integration of institution',
      {top10Transactions: JSON.stringify(transactions.slice(0,10))}
    );
    return transactions.sort((a, b) => {
      const [aTime, aSeq] = a.transactionId.split('-');
      const [bTime, bSeq] = b.transactionId.split('-');

      return Number(bTime) - Number(aTime) || Number(bSeq) - Number(aSeq);
    });
  }

  // https://nordigen.com/en/docs/account-information/output/balance/
  /**
   * Amount of balance before all provided transactions. It's required to add initial transaction with "Starting balance"
   *
   * @param {Array<Transaction>} sortedTransactions an array of transactions in order from newest (first element of the array) to oldest (last elements of the array)
   * @param balances Each bank have could have different balance types available.
   *   list and description of the possible balance types you can find here - https://nordigen.com/en/docs/account-information/output/balance/
   *
   *    For SANDBOXFINANCE_SFIN0000 we don't know what balance was
   *    after each transaction so we have to calculate it by getting
   *    current balance from the account and subtract all the transactions
   *
   *    As a current balance we use `interimBooked` balance type because
   *    it includes transaction placed during current day
   * @returns {number} Amount in "cents" of balance before all provided transactions
   */
  calculateStartingBalance = (sortedTransactions = [], balances = []) => {
    const currentBalance = balances.find((balance) => 'interimAvailable' === balance.balanceType)

    return sortedTransactions.reduce((total, trans) => {
      return total - amountToInteger(trans.transactionAmount.amount);
    }, amountToInteger(currentBalance.balanceAmount.amount));
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
    console.log(
      'Available account properties for new institution integration',
      {account: JSON.stringify(account)}
    );
    return {
      account_id: account.id,
      institution: account.institution,
      mask: account.iban.slice(-4),
      name: [account.product, printIban(account)].join(' ').trim(),
      official_name: account.product,
      type: 'checking'
    }
  }

  sortTransactions = (transactions = []) => {
    console.log(
      'Available (first 10) transactions properties for new integration of institution',
      {top10Transactions: JSON.stringify(transactions.slice(0,10))}
    );
    return transactions.sort((a, b) => {
      return Number(b.transactionId.substr(2)) - Number(a.transactionId.substr(2));
    });
  };

  calculateStartingBalance = (sortedTransactions = [], balances = []) => {
    console.log(
      'Available (first 10) transactions properties for new integration of institution',
      {balances: JSON.stringify(balances), top10SortedTransactions:JSON.stringify(sortedTransactions.slice(0,10))}
    );
    if (sortedTransactions.length) {
      const oldestTransaction = sortedTransactions[sortedTransactions.length - 1];
      const oldestKnownBalance = amountToInteger(oldestTransaction.balanceAfterTransaction.balanceAmount.amount)
      const oldestTransactionAmount = amountToInteger(oldestTransaction.transactionAmount.amount)

      return oldestKnownBalance - oldestTransactionAmount;
    } else {
      return amountToInteger((balances.find((balance) => 'interimBooked' === balance.balanceType)).balanceAmount.amount)
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
      {account: JSON.stringify(account)}
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

  sortTransactions = (transactions = []) => {
    console.log(
      'Available (first 10) transactions properties for new integration of institution',
      {top10Transactions: JSON.stringify(transactions.slice(0,10))}
    );
    return transactions;
  };


  // https://nordigen.com/en/docs/account-information/output/balance/
  /**
   *
   * @param {Array<Object>}sortedTransactions array of transactions sorted from the newest to the oldest
   * @param balances Each bank have could have different balance types available.
   *   list and description of the possible balances you can find here - https://nordigen.com/en/docs/account-information/output/balance/
   * @returns {*}
   */

  calculateStartingBalance = (sortedTransactions = [], balances = []) => {
    console.log(
      'Available (first 10) transactions properties for new integration of institution',
      {balances: JSON.stringify(balances), top10SortedTransactions:JSON.stringify(sortedTransactions.slice(0,10))}
    );
    return 0
  }
}

const BankFactory = (institutionId) => {
  switch (institutionId) {
    case MbankRetailBrexplpw.institutionId:
      return new MbankRetailBrexplpw()
    case SandboxfinanceSfin0000.institutionId:
      return new SandboxfinanceSfin0000()
    case IngPlIngbplpw.institutionId:
      return new IngPlIngbplpw();
    default:
      return new IntegrationBank();
  }
}

module.exports = BankFactory
