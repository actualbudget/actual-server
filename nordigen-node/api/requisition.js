"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _httpMethod = require("../httpMethod.js");

class RequisitionsApi {
  #endpoint = "requisitions";
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
   * Create requisition. For creating links and retrieving accounts.
   * @param {Object} params
   * @param {string} params.redirectUrl application redirect url
   * @param {string} params.institutionId institution id
   * @param {string} [params.agreement] agreement id
   * @param {string} [params.userLanguage] to enforce a language for all end user steps hosted
              by Nordigen passed as a two-letter country code. Defaults to None
   * @param {string} params.reference additional layer of unique ID defined by yo
   * @returns Requisition object
  */


  createRequisition({
    redirectUrl,
    institutionId,
    agreement,
    userLanguage,
    reference
  }) {
    const payload = {
      "redirect": redirectUrl,
      "reference": reference,
      "institution_id": institutionId,
      ...(userLanguage && {
        "user_language": userLanguage
      }),
      ...(agreement && {
        "agreement": agreement
      })
    };
    return this.#client.request({
      endpoint: `${this.#endpoint}/`,
      parameters: payload,
      method: _httpMethod.HttpMethod.POST
    });
  }
  /**
   * Get all requisitions@param {Object} params
   * @param {Object} params
   * @param {number} [params.limit] number of results to return per page. Defaults to 100.
   * @param {number} [params.offset] the initial index from which to return the results. Defaults to 0.
   * @returns Requisitions object
   */


  getRequisitions({
    limit = 100,
    offset = 0
  } = {}) {
    const params = {
      limit,
      offset
    };
    return this.#client.request({
      endpoint: `${this.#endpoint}/`,
      method: _httpMethod.HttpMethod.GET,
      parameters: params
    });
  }
  /**
   * Get requisition by id
   * @param {string} requisitionId 
   * @returns Returns specific requisition
   */


  getRequisitionById(requisitionId) {
    return this.#client.request({
      endpoint: `${this.#endpoint}/${requisitionId}/`
    });
  }
  /**
   * Delete requisition by id
   * @param {string} requisitionId 
   * @returns Object that consist confirmation message that requisition has been deleted
   */


  deleteRequisition(requisitionId) {
    return this.#client.request({
      endpoint: `${this.#endpoint}/${requisitionId}/`,
      method: _httpMethod.HttpMethod.DELETE
    });
  }

}

exports.default = RequisitionsApi;
//# sourceMappingURL=requisition.js.map