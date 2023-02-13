import BankFactory from '../bank-factory.js';
import {
  RequisitionNotLinked,
  AccountNotLinedToRequisition,
  InvalidInputDataError,
  InvalidNordigenTokenError,
  AccessDeniedError,
  NotFoundError,
  ResourceSuspended,
  RateLimitError,
  UnknownError,
  ServiceError
} from '../errors.js';
import * as nordigenNode from 'nordigen-node';
import uuid from '@actual-app/api/app/bundle.api.js';
const NordigenClient = nordigenNode.default;
const nordigenClient = new NordigenClient({
  secretId: process.env.SECRET_ID,
  secretKey: process.env.SECRET_KEY
});

export const handleNordigenError = (response) => {
  switch (response.status_code) {
    case 400:
      throw new InvalidInputDataError(response);
    case 401:
      throw new InvalidNordigenTokenError(response);
    case 403:
      throw new AccessDeniedError(response);
    case 404:
      throw new NotFoundError(response);
    case 409:
      throw new ResourceSuspended(response);
    case 429:
      throw new RateLimitError(response);
    case 500:
      throw new UnknownError(response);
    case 503:
      throw new ServiceError(response);
    default:
      return;
  }
};

export const nordigenService = {
  /**
   *
   * @returns {Promise<void>}
   */
  setToken: async () => {
    if (!nordigenClient.token) {
      const tokenData = await nordigenClient.generateToken();
      handleNordigenError(tokenData);
      nordigenClient.token = tokenData.access;
    }
  },

  /**
   *
   * @param requisitionId
   * @throws {RequisitionNotLinked} Will throw an error if requisition is not in Linked
   * @throws {InvalidInputDataError}
   * @throws {InvalidNordigenTokenError}
   * @throws {AccessDeniedError}
   * @throws {NotFoundError}
   * @throws {ResourceSuspended}
   * @throws {RateLimitError}
   * @throws {UnknownError}
   * @throws {ServiceError}
   * @returns {Promise<import('../nordigen-node.types').Requisition>}
   */
  getLinkedRequisition: async (requisitionId) => {
    const requisition = await nordigenService.getRequisition(requisitionId);

    const { status } = requisition;

    // Continue only if status of requisition is "LN" what does
    // mean that account has been successfully linked to requisition
    if (status !== 'LN') {
      throw new RequisitionNotLinked({ requisitionStatus: status });
    }

    return requisition;
  },

  /**
   * Returns requisition and all linked accounts in their Bank format.
   * Each account object is extended about details of the institution
   * @param requisitionId
   * @throws {RequisitionNotLinked} Will throw an error if requisition is not in Linked
   * @throws {InvalidInputDataError}
   * @throws {InvalidNordigenTokenError}
   * @throws {AccessDeniedError}
   * @throws {NotFoundError}
   * @throws {ResourceSuspended}
   * @throws {RateLimitError}
   * @throws {UnknownError}
   * @throws {ServiceError}
   * @returns {Promise<{requisition: import('../nordigen-node.types').Requisition, accounts: Array<import('../nordigen.types').NormalizedAccountDetails>}>}
   */
  getRequisitionWithAccounts: async (requisitionId) => {
    const requisition = await nordigenService.getLinkedRequisition(requisitionId);

    let institutionIdSet = new Set();
    const detailedAccounts = await Promise.all(
      requisition.accounts.map(async (accountId) => {
        const account = await nordigenService.getDetailedAccount(accountId);
        institutionIdSet.add(account.institution_id);
        return account;
      })
    );

    const institutions = await Promise.all(
      Array.from(institutionIdSet).map(async (institutionId) => {
        return await nordigenService.getInstitution(institutionId);
      })
    );

    const extendedAccounts = await nordigenService.extendAccountsAboutInstitutions({
      accounts: detailedAccounts,
      institutions
    });

    const normalizedAccounts = extendedAccounts.map((account) => {
      const bankAccount = BankFactory(account.institution_id);
      return bankAccount.normalizeAccount(account);
    });

    return { requisition, accounts: normalizedAccounts };
  },

  /**
   *
   * @param requisitionId
   * @param accountId
   * @param startDate
   * @param endDate
   * @throws {AccountNotLinedToRequisition} Will throw an error if requisition not includes provided account id
   * @throws {RequisitionNotLinked} Will throw an error if requisition is not in Linked
   * @throws {InvalidInputDataError}
   * @throws {InvalidNordigenTokenError}
   * @throws {AccessDeniedError}
   * @throws {NotFoundError}
   * @throws {ResourceSuspended}
   * @throws {RateLimitError}
   * @throws {UnknownError}
   * @throws {ServiceError}
   * @returns {Promise<{balances: Array<import('../nordigen-node.types').Balance>, institutionId: string, transactions: {booked: Array<import('../nordigen-node.types').Transaction>, pending: Array<import('../nordigen-node.types').Transaction>}, startingBalance: number}>}
   */
  getTransactionsWithBalance: async (requisitionId, accountId, startDate, endDate) => {
    const { institution_id, accounts: accountIds } = await nordigenService.getLinkedRequisition(requisitionId);

    if (!accountIds.includes(accountId)) {
      throw new AccountNotLinedToRequisition(accountId, requisitionId);
    }

    const [transactions, accountBalance] = await Promise.all([
      nordigenService.getTransactions({
        accountId,
        startDate,
        endDate
      }),
      nordigenService.getBalances(accountId)
    ]);

    const bank = BankFactory(institution_id);
    const sortedBookedTransactions = bank.sortTransactions(transactions.transactions?.booked);
    const sortedPendingTransactions = bank.sortTransactions(transactions.transactions?.pending);

    const startingBalance = bank.calculateStartingBalance(sortedBookedTransactions, accountBalance.balances);

    return {
      balances: accountBalance.balances,
      institutionId: institution_id,
      startingBalance,
      transactions: {
        booked: sortedBookedTransactions,
        pending: sortedPendingTransactions
      }
    };
  },

  /**
   *
   * @param {import('../nordigen.types').CreateRequisitionParams} params
   * @throws {InvalidInputDataError}
   * @throws {InvalidNordigenTokenError}
   * @throws {AccessDeniedError}
   * @throws {NotFoundError}
   * @throws {ResourceSuspended}
   * @throws {RateLimitError}
   * @throws {UnknownError}
   * @throws {ServiceError}
   * @returns {Promise<{requisitionId, link}>}
   */
  createRequisition: async ({ institutionId, accessValidForDays, host }) => {
    await nordigenService.setToken();

    const response = await nordigenClient.initSession({
      redirectUrl: host + '/nordigen/link',
      institutionId,
      referenceId: uuid.v4,
      accessValidForDays
    });

    handleNordigenError(response);

    const { link, id: requisitionId } = response;

    return {
      link,
      requisitionId
    };
  },

  /**
   * Deletes requisition by provided ID
   * @param requisitionId
   * @throws {InvalidInputDataError}
   * @throws {InvalidNordigenTokenError}
   * @throws {AccessDeniedError}
   * @throws {NotFoundError}
   * @throws {ResourceSuspended}
   * @throws {RateLimitError}
   * @throws {UnknownError}
   * @throws {ServiceError}
   * @returns {Promise<{summary: string, detail: string}>}
   */
  deleteRequisition: async (requisitionId) => {
    await nordigenService.getRequisition(requisitionId);
    const response = await nordigenClient.requisition.deleteRequisition(requisitionId);

    handleNordigenError(response);
    return response;
  },

  /**
   * Retrieve a requisition by ID
   * https://nordigen.com/en/docs/account-information/integration/parameters-and-responses/#/requisitions/requisition%20by%20id
   * @param { string } requisitionId
   * @throws {InvalidInputDataError}
   * @throws {InvalidNordigenTokenError}
   * @throws {AccessDeniedError}
   * @throws {NotFoundError}
   * @throws {ResourceSuspended}
   * @throws {RateLimitError}
   * @throws {UnknownError}
   * @throws {ServiceError}
   * @returns { Promise<import('../nordigen-node.types').Requisition> }
   */
  getRequisition: async (requisitionId) => {
    await nordigenService.setToken();

    const response = await nordigenClient.requisition.getRequisitionById(requisitionId);

    handleNordigenError(response);

    return response;
  },

  /**
   * Retrieve an detailed account by account id
   * @param accountId
   * @returns {Promise<import('../nordigen.types').DetailedAccount>}
   */
  getDetailedAccount: async (accountId) => {
    const [detailedAccount, metadataAccount] = await Promise.all([
      nordigenClient.account(accountId).getDetails(),
      nordigenClient.account(accountId).getMetadata()
    ]);

    handleNordigenError(detailedAccount);
    handleNordigenError(metadataAccount);

    return {
      ...detailedAccount.account,
      ...metadataAccount
    };
  },

  /**
   * Retrieve details about a specific Institution
   * @param institutionId
   * @throws {InvalidInputDataError}
   * @throws {InvalidNordigenTokenError}
   * @throws {AccessDeniedError}
   * @throws {NotFoundError}
   * @throws {ResourceSuspended}
   * @throws {RateLimitError}
   * @throws {UnknownError}
   * @throws {ServiceError}
   * @returns {Promise<import('../nordigen-node.types').Institution>}
   */
  getInstitution: async (institutionId) => {
    const response = await nordigenClient.institution.getInstitutionById(institutionId);

    handleNordigenError(response);

    return response;
  },

  /**
   * Extends provided accounts about details of their institution
   * @param {{accounts: Array<import('../nordigen.types').DetailedAccount>, institutions: Array<import('../nordigen-node.types').Institution>}} params
   * @returns {Promise<Array<import('../nordigen.types').DetailedAccount&{institution: import('../nordigen-node.types').Institution}>>}
   */
  extendAccountsAboutInstitutions: async ({ accounts, institutions }) => {
    const institutionsById = institutions.reduce((acc, institution) => {
      acc[institution.id] = institution;
      return acc;
    }, {});

    return accounts.map((account) => {
      const institution = institutionsById[account.institution_id] || null;
      return {
        ...account,
        institution
      };
    });
  },

  /**
   * Returns account transaction in provided dates
   * @param {import('../nordigen.types').GetTransactionsParams} params
   * @throws {InvalidInputDataError}
   * @throws {InvalidNordigenTokenError}
   * @throws {AccessDeniedError}
   * @throws {NotFoundError}
   * @throws {ResourceSuspended}
   * @throws {RateLimitError}
   * @throws {UnknownError}
   * @throws {ServiceError}
   * @returns {Promise<import('../nordigen.types').GetTransactionsResponse>}
   */
  getTransactions: async ({ accountId, startDate, endDate }) => {
    const response = await nordigenClient.account(accountId).getTransactions({ dateFrom: startDate, dateTo: endDate });

    handleNordigenError(response);

    return response;
  },

  /**
   * Returns account available balances
   * @param accountId
   * @throws {InvalidInputDataError}
   * @throws {InvalidNordigenTokenError}
   * @throws {AccessDeniedError}
   * @throws {NotFoundError}
   * @throws {ResourceSuspended}
   * @throws {RateLimitError}
   * @throws {UnknownError}
   * @throws {ServiceError}
   * @returns {Promise<import('../nordigen.types').GetBalances>}
   */
  getBalances: async (accountId) => {
    const response = await nordigenClient.account(accountId).getBalances();

    handleNordigenError(response);

    return response;
  }
};
