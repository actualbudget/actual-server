"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _httpMethod = require("../httpMethod.js");

class AgreementApi {
  #endpoint = "agreements/enduser";
  #client = null;
  /**
   * Agreements api class
   * @param {Object} params
   * @param {NordigenClient} params.client
  */

  constructor({
    client
  }) {
    this.#client = client;
  }
  /**
   * Create enduser agreement
   * @param {Object} params
   * @param {string} params.institutionId Institutions ID.
   * @param {number} [params.maxHistoricalDays] Length of the transaction history. Defaults to 90.
   * @param {number} [params.accessValidForDays] access valid for days. Defaults to 90.
   * @param {string[]} [params.accessScope access] scope for account, by default provides access to balances, details and transactions.
   * @returns Agreement object
   */


  createAgreement({
    institutionId,
    maxHistoricalDays = 90,
    accessValidForDays = 90,
    accessScope = ["balances", "details", "transactions"]
  }) {
    const payload = {
      "institution_id": institutionId,
      "max_historical_days": maxHistoricalDays,
      "access_valid_for_days": accessValidForDays,
      "access_scope": accessScope
    };
    return this.#client.request({
      endpoint: `${this.#endpoint}/`,
      parameters: payload,
      method: _httpMethod.HttpMethod.POST
    });
  }
  /**
   * Get list of agreements
   * @param {Object} params
   * @param {number} [params.limit] number of results to return per page. Defaults to 100.
   * @param {number} [params.offset] the initial index from which to return the results. Defaults to 0.
   * @returns End user agreements
  */


  getAgreements({
    limit = 100,
    offset = 0
  } = {}) {
    const params = {
      limit,
      offset
    };
    return this.#client.request({
      endpoint: `${this.#endpoint}/`,
      parameters: params
    });
  }
  /**
   * Get agreement by agreement id
   * @param {string} agreementId
   * @returns object with specific enduser agreement
   */


  getAgreementById(agreementId) {
    return this.#client.request({
      endpoint: `${this.#endpoint}/${agreementId}/`
    });
  }
  /**
   * Delete enduser agreement
   * @param {string} agreementId
   * @returns Deleted agreement object
   */


  deleteAgreement(agreementId) {
    return this.#client.request({
      endpoint: `${this.#endpoint}/${agreementId}/`,
      method: _httpMethod.HttpMethod.DELETE
    });
  }
  /**
   * Accept End user agreement
   * @param {Object} params
   * @param {string} params.agreementId
   * @param {string} params.ip
   * @param {string} params.userAgent
   * @returns Information on accepted agreement
   */


  acceptAgreement({
    agreementId,
    ip,
    userAgent
  }) {
    const payload = {
      'user_agent': userAgent,
      'ip_address': ip
    };
    return this.#client.request({
      endpoint: `${this.#endpoint}/${agreementId}/accept/`,
      parameters: payload,
      method: _httpMethod.HttpMethod.PUT
    });
  }

}

exports.default = AgreementApi;
//# sourceMappingURL=agreements.js.map