const uuid = require("uuid");
const NordigenClient = require('./../nordigen-node/index').default;

const nordigenClient = new NordigenClient({
  secretId: process.env.SECRET_ID,
  secretKey: process.env.SECRET_KEY
});

const nordigenService =
 {
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

  /**
   * @typedef {Object} DetailedAccount
   * @property {string} resourceId
   * @property {string} iban
   * @property {string} currency
   * @property {string} ownerName
   * @property {string} name
   * @property {string} product
   * @property {string} cashAccountType
   *
   * @property {string} id
   * @property {string} created
   * @property {string} last_accessed
   * @property {string} iban
   * @property {string} institution_id
   * @property {string} status DISCOVERED -> "User has successfully authenticated and account is discovered", "PROCESSING" -> "Account is being processed by the Institution", "ERROR" -> "An error was encountered when processing account", "EXPIRED" -> "Access to account has expired as set in End User Agreement", "READY" -> "Account has been successfully processed", "SUSPENDED" -> "Account has been suspended (more than 10 consecutive failed attempts to access the account)"
   * @property {string} owner_name
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
    *
    * @param institutionId
    * @param accessValidForDays
    * @param host
    * @returns {Promise<{requisitionId, link}>}
    */
  createRequisition: async ({institutionId, accessValidForDays, host}) => {
    const tokenData = await nordigenClient.generateToken();
    nordigenClient.token = tokenData.access;

    // Initialize new bank session
     const { link, id: requisitionId } = await nordigenClient.initSession({
      redirectUrl: host + '/nordigen/link',
      institutionId,
      referenceId: uuid.v4(),
      accessValidForDays
    });

    return {
      link,
      requisitionId,
    }
  },

  deleteRequisition: async (requisitionId) => {
    return await nordigenClient.requisition.deleteRequisition(requisitionId);
  },

   /**
   * Retrieve a requisition by ID
   * https://nordigen.com/en/docs/account-information/integration/parameters-and-responses/#/requisitions/requisition%20by%20id
   * @param { string } requisitionId
   * @returns { Promise<Requisition> }
   */
  getRequisition: async (requisitionId) => {
    if(!nordigenClient.token) {
      const tokenData = await nordigenClient.generateToken();
      nordigenClient.token = tokenData.access;
    }
    return await nordigenClient.requisition.getRequisitionById(
      requisitionId
    );
  },

  /**
   *  Retrieve an detailed account by account id
   *  merge of
   *   - https://nordigen.com/en/docs/account-information/integration/parameters-and-responses/#/accounts/retrieve%20account%20metadata
   *   - https://nordigen.com/en/docs/account-information/integration/parameters-and-responses/#/accounts/accounts_details_retrieve
   * @param accountId
   * @returns {Promise<DetailedAccount>}
   */
  getDetailedAccount: async ({ accountId }) => {
    const [detailedAccount, metadataAccount] = await Promise.all([
      nordigenClient.account(accountId).getDetails(),
      nordigenClient.account(accountId).getMetadata()
    ]);

    return {
      ...detailedAccount.account,
      ...metadataAccount
    };
  },

  /**
   * Retrieve details about a specific Institution
   * @param institutionId
   * @returns {Promise<Institution>}
   */
  getInstitution: async ({ institutionId }) => {
    return await nordigenClient.institution.getInstitutionById(institutionId);
  },

  /**
   *
   * @param {{accounts: Array<DetailedAccount>, institutions: Array<Institution>}} params
   * @returns {Promise<Array<DetailedAccount&{institution: Institution}>>}
   */
  extendAccountsAboutInstitutions: async ({accounts, institutions}) => {
    return accounts.map((account) => {
      const institution = institutions.find(
        (institution) => institution.id === account.institution_id
      );

      return {
        ...account,
        institution,
      }
    });
  },
}

module.exports = nordigenService;

