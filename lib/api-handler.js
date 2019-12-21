/**
 * @module API Handler base class.
 *
 * Allows add-ons to create generic REST API handlers without having to create
 * a full HTTP server.
 */
/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.*
 */

'use strict';

/**
 * Class which holds an API request.
 */
class APIRequest {
  /**
   * Build the request.
   *
   * @param {object} params - Request parameters, as such:
   *                   .method {string} HTTP method, e.g. GET, POST, etc.
   *                   .path {string} Path relative to this handler, e.g.
   *                     '/mypath' rather than
   *                     '/extensions/my-extension/api/mypath'.
   *                   .query {object} Object containing query parameters
   *                   .body {object} Body content in key/value form. All
   *                     content should be requested as application/json or
   *                     application/x-www-form-urlencoded data in order for it
   *                     to be parsed properly.
   */
  constructor(params) {
    this.method = params.method;
    this.path = params.path;
    this.query = params.query || {};
    this.body = params.body || {};
  }
}

/**
 * Convenience class to build an API response.
 */
class APIResponse {
  /**
   * Build the response.
   *
   * @param {object} params - Response parameters, as such:
   *                   .status {number} (Required) Status code
   *                   .contentType {string} Content-Type of response content
   *                   .content {string} Response content
   */
  constructor(params) {
    if (!params || !params.hasOwnProperty('status')) {
      this.status = 500;
      this.contentType = null;
      this.content = null;
      return;
    }

    this.status = Number(params.status);

    if (typeof params.contentType === 'undefined') {
      this.contentType = null;
    } else if (params.contentType !== null &&
               typeof params.contentType !== 'string') {
      this.contentType = `${params.contentType}`;
    } else {
      this.contentType = params.contentType;
    }

    if (typeof params.content === 'undefined') {
      this.content = null;
    } else if (params.content !== null && typeof params.content !== 'string') {
      this.content = `${params.content}`;
    } else {
      this.content = params.content;
    }
  }
}

/**
 * Base class for API handlers, which handle sending alerts to a user.
 * @class Notifier
 */
class APIHandler {
  constructor(addonManager, packageName) {
    this.manager = addonManager;
    this.packageName = packageName;
    this.gatewayVersion = addonManager.gatewayVersion;
    this.userProfile = addonManager.userProfile;
    this.preferences = addonManager.preferences;
  }

  getPackageName() {
    return this.packageName;
  }

  /**
   * @method handleRequest
   *
   * Called every time a new API request comes in for this handler.
   *
   * @param {APIRequest} request - Request object
   *
   * @returns {APIResponse} API response object.
   */
  async handleRequest(request) {
    console.log(`New API request for ${this.packageName}:`, request);
    return new APIResponse({status: 404});
  }

  /**
   * Unloads the handler.
   *
   * @returns a promise which resolves when the handler has finished unloading.
   */
  unload() {
    console.log('API Handler', this.packageName, 'unloaded');
    return Promise.resolve();
  }
}

module.exports = {APIHandler, APIRequest, APIResponse};
