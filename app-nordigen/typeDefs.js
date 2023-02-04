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
 * @property {boolean} account_selection false,
 * @property {boolean} redirect_immediate false
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
 * @property {string} amount
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
 * @property {{iban: string}} [debtorAccount] Account Reference  Conditional
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

/**
 * @typedef {Object} CreateRequisitionParams
 * @property {string} institutionId
 * @property {number} accessValidForDays
 * @property {string} host Host of your frontend app - on this host you will be redirected after linking with bank
 * @example
 * {institutionId: "d3eccc94-9536-48d3-98be-813f79199ee3", accessValidForDays: 90, host: "http://localhost"}
 */

/**
 * @typedef {Object} Balance
 * @property {Amount} balanceAmount - An object containing the balance amount and currency
 * @property {string} balanceType - The type of balance (closingBooked, expected, forwardAvailable, interimAvailable, interimBooked, nonInvoiced, or openingBooked)
 * @property {boolean} [creditLimitIncluded] - A flag indicating if the credit limit of the corresponding account is included in the calculation of the balance (if applicable)
 * @property {string} [lastChangeDateTime] - The date and time of the last change to the balance
 * @property {string} [lastCommittedTransaction] - The reference of the last committed transaction to support the TPP in identifying whether all end users transactions are already known
 * @property {string} [referenceDate] - The date of the balance
 */
/**
 * @typedef {Object} GetBalances
 * @property {Array<Balance>} balances
 */
