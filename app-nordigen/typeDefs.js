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
 * @property {string} [ownerAddressUnstructured] Address of the legal account owner
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
