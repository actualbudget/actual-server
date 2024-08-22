import AccountSet from '../models/account-set.ts';
import {
  SimplefinContextData,
  SimpleFinApiInterface,
} from './simplefin-api.ts';

class SimpleFinService {
  private simplefinApi: SimpleFinApiInterface;

  /**
   * @param simplefinApi - The secrets service dependency.
   */
  constructor(simplefinApi: SimpleFinApiInterface) {
    this.simplefinApi = simplefinApi;
  }

  /**
   * Retrieves the access key using the provided base64 token.
   *
   * @param base64Token - The base64 encoded token used for authentication.
   * @returns - A promise that resolves to the access key.
   */
  async getAccessKey(base64Token: string): Promise<string> {
    const context = new SimplefinContextData(
      'GET',
      443,
      { 'Content-Length': 0 },
      base64Token,
    );

    this.simplefinApi.setContext(context);
    return this.simplefinApi.fetchAccessKey().then(() => context.accessKey);
  }

  /**
   * Retrieves accounts using the Simplefin API.
   *
   * @param accessKey - The access key for authentication.
   * @param startDate - The start date for filtering accounts.
   * @param endDate - The end date for filtering accounts.
   * @returns - A promise that resolves to an AccountSet.
   */
  async getAccounts(
    accessKey: string,
    startDate: Date,
    endDate: Date,
  ): Promise<AccountSet> {
    const context = new SimplefinContextData('GET', 443);
    context.parseAccessKey(accessKey);
    this.simplefinApi.setContext(context);
    return await this.simplefinApi
      .fetchAccounts(startDate, endDate)
      .then((accounts) => accounts);
  }

  /**
   * Retrieves transactions within a specified date range.
   * @param accessKey - The access key for authentication.
   * @param startDate - The start date of the date range. If not provided, defaults to the first day of the current month.
   * @param endDate - The end date of the date range. If not provided, defaults to the first day of the next month.
   * @returns - A promise that resolves to an array of transactions.
   */
  async getTransactions(
    accessKey: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<AccountSet> {
    const now = new Date();
    startDate = startDate || new Date(now.getFullYear(), now.getMonth(), 1);
    endDate = endDate || new Date(now.getFullYear(), now.getMonth() + 1, 1);
    console.log(
      `${startDate.toISOString().split('T')[0]} - ${
        endDate.toISOString().split('T')[0]
      }`,
    );
    const accountSet = await this.getAccounts(accessKey, startDate, endDate);
    return accountSet;
  }
}

export { SimpleFinService };
