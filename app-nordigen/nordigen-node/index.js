// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});
exports.default = void 0;

const { AccountApi } = require('./api/index.js');
var _index = require('./api/index.js');
const { HttpMethod } = require('./httpMethod.js');

var _httpMethod = require('./httpMethod.js');

var _utils = require('./utils.js');

var _nodeFetch = _interopRequireDefault(require('node-fetch'));

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : { default: obj };
}

class NordigenClient {
  #endpoint = 'token';
  #token = null;
  /**
   *
   * @param {Object} params
   * @param {string} params.secretId
   * @param {string} params.secretKey
   */

  constructor({ secretId, secretKey }) {
    this.baseUrl = `https://ob.nordigen.com/api/v2`;
    this.secretKey = secretKey;
    this.secretId = secretId;
    this.headers = {
      accept: 'application/json',
      'Content-Type': 'application/json',
      'User-Agent': 'Nordigen-Node-v2'
    };
    this.institution = new _index.InstitutionApi({
      client: this
    });
    this.agreement = new _index.AgreementApi({
      client: this
    });
    this.requisition = new _index.RequisitionsApi({
      client: this
    });
  }
  /**
   * Token setter
   * @param {string} token
   */

  set token(token) {
    this.#token = token;
    this.headers['Authorization'] = `Bearer ${token}`;
  }
  /**
   * Token getter
   * @returns {string} token
   */

  get token() {
    return this.#token;
  }
  /**
   * Construct Account object
   * @param {string} accountId
   * @returns {AccountApi}
   */

  account(accountId) {
    return new _index.AccountApi({
      client: this,
      accountId: accountId
    });
  }
  /**
   * Request wrapper
   * @param {Object} params
   * @param {string} params.endpoint API endpoint
   * @param {string} params.parameters for Post or Get request
   * @param {HttpMethod} [params.method] HTTP method
   * @returns Request object
   */

  async request({ endpoint, parameters, method = _httpMethod.HttpMethod.GET }) {
    const url = new URL(`${this.baseUrl}/${endpoint}`);
    const validParams = (0, _utils.filterObject)(parameters);

    if (
      method === _httpMethod.HttpMethod.GET &&
      Object.keys(validParams).length > 0
    ) {
      url.search = new URLSearchParams(validParams);
    }

    const response = await (0, _nodeFetch.default)(url, {
      method,
      headers: this.headers,
      ...(method !== _httpMethod.HttpMethod.GET
        ? {
            body: JSON.stringify(parameters)
          }
        : {})
    });
    return response.json();
  }
  /**
   * Generate new access token
   * @returns Object with token details
   */

  async generateToken() {
    const payload = {
      secret_key: this.secretKey,
      secret_id: this.secretId
    };
    const response = await this.request({
      endpoint: `${this.#endpoint}/new/`,
      parameters: payload,
      method: _httpMethod.HttpMethod.POST
    });
    this.headers['Authorization'] = `Bearer ${response.access}`;
    return response;
  }
  /**
   * Exchange refresh token for access token
   * @param {Object} params
   * @param {string} params.refreshToken
   * @returns Object with new access token
   */

  exchangeToken({ refreshToken }) {
    const payload = {
      refresh: refreshToken
    };
    const response = this.request({
      endpoint: `${this.#endpoint}/refresh/`,
      parameters: payload,
      method: _httpMethod.HttpMethod.POST
    });
    return response;
  }
  /**
   * Factory method that creates authorization in a specific institution
      and are responsible for the following steps:
          * Gets institution id;
          * Creates agreement
          * Creates requisiton
   * @param {Object} params
   * @param {string} params.redirectUrl
   * @param {string} params.institutionId
   * @param {string} params.referenceId
   * @param {number} [params.maxHistoricalDays]
   * @param {number} [params.accessValidForDays]
   * @returns Requisitions object
  */

  async initSession({
    accessValidForDays = 90,
    redirectUrl,
    institutionId,
    referenceId,
    maxHistoricalDays = 90
  }) {
    // Create agreement
    const agreement = await this.agreement.createAgreement({
      maxHistoricalDays: maxHistoricalDays,
      accessValidForDays: accessValidForDays,
      institutionId: institutionId
    }); // Create new requisition

    const requisition = await this.requisition.createRequisition({
      redirectUrl: redirectUrl,
      institutionId: institutionId,
      reference: referenceId,
      agreement: agreement.id
    });
    return requisition;
  }
}

exports.default = NordigenClient;
//# sourceMappingURL=index.js.map
