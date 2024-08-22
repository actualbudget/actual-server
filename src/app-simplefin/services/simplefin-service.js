// simplefin-api.js
import https from 'https';
import { Buffer } from 'buffer';
import { SimplefinApi, SimplefinContextData } from './simplefin-api.ts'
import AccountSet from '../models/account-set.ts';
class SimpleFinService {

  /**
 * @param {import('./simplefin-api.ts').SimpleFinApiInterface} simplefinApi - The secrets service dependency.
 */
  constructor(simplefinApi) {
    this.simplefinApi = simplefinApi
  }


  /**
   * Retrieves the access key using the provided base64 token.
   * 
   * @param {string} base64Token - The base64 encoded token used for authentication.
   * @returns {Promise<string>} - A promise that resolves to the access key.
   */
  async getAccessKey(base64Token) {
    let context = new SimplefinContextData('GET', 443, { 'Content-Length': 0 }, base64Token)

    this.simplefinApi.setContext(context)
    return this.simplefinApi.fetchAccessKey().then(() => context.accessKey)
  }

  /**
   * Retrieves accounts using the Simplefin API.
   *
   * @param {string} accessKey - The access key for authentication.
   * @param {Date} startDate - The start date for filtering accounts.
   * @param {Date} endDate - The end date for filtering accounts.
   * @returns {Promise<AccountSet>} - A promise that resolves to an AccountSet.
   */
  async getAccounts(accessKey, startDate, endDate) {
    let context = new SimplefinContextData('GET', 443);
    context.parseAccessKey(accessKey);
    this.simplefinApi.setContext(context);
    return await this.simplefinApi.fetchAccounts(startDate, endDate).then((accounts) => accounts);

  }

  /**
   * Retrieves transactions within a specified date range.
   * @param {string} accessKey - The access key for authentication.
   * @param {Date} startDate - The start date of the date range. If not provided, defaults to the first day of the current month.
   * @param {Date} endDate - The end date of the date range. If not provided, defaults to the first day of the next month.
   * @returns {Promise<AccountSet>} - A promise that resolves to an array of transactions.
   */
  async getTransactions(accessKey, startDate, endDate) {
    const now = new Date();
    startDate = startDate || new Date(now.getFullYear(), now.getMonth(), 1);
    endDate = endDate || new Date(now.getFullYear(), now.getMonth() + 1, 1);
    console.log(
      `${startDate.toISOString().split('T')[0]} - ${endDate.toISOString().split('T')[0]
      }`,
    );
    let accountSet = await this.getAccounts(accessKey, startDate, endDate);
    return accountSet
  }

}

export { SimpleFinService };