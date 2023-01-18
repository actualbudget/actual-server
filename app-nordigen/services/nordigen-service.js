const uuid = require("uuid");
const NordigenClient = require('./../nordigen-node/index').default;

const nordigenClient = new NordigenClient({
  secretId: process.env.SECRET_ID,
  secretKey: process.env.SECRET_KEY
});

const nordigenService =
 {
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

