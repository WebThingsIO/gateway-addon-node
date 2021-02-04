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

import { AddonManagerProxy } from './addon-manager-proxy';
import { Preferences, Response, Request, UserProfile } from './schema';

/**
 * Class which holds an API request.
 */
export class APIRequest {
  private method: string;

  private path: string;

  private query: Record<string, unknown>;

  private body: Record<string, unknown>;

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
  constructor({ method, path, query, body }: Request) {
    this.method = method;
    this.path = path;
    this.query = query ?? {};
    this.body = body ?? {};
  }

  getMethod(): string {
    return this.method;
  }

  getPath(): string {
    return this.path;
  }

  getQuery(): Record<string, unknown> {
    return this.query;
  }

  getBody(): Record<string, unknown> {
    return this.body;
  }
}

/**
 * Convenience class to build an API response.
 */
export class APIResponse {
  private status: number;

  private contentType?: string;

  private content?: string;

  /**
   * Build the response.
   *
   * @param {object} params - Response parameters, as such:
   *                   .status {number} (Required) Status code
   *                   .contentType {string} Content-Type of response content
   *                   .content {string} Response content
   */
  constructor({ status, contentType, content }: Response = { status: 500 }) {
    this.status = Number(status);

    if (contentType) {
      this.contentType = `${contentType}`;
    }

    if (content) {
      this.content = `${content}`;
    }
  }

  getStatus(): number {
    return this.status;
  }

  getContentType(): string | undefined {
    return this.contentType;
  }

  getContent(): string | undefined {
    return this.content;
  }

  asDict(): Response {
    return {
      status: this.status,
      contentType: this.contentType,
      content: this.content,
    };
  }
}

/**
 * Base class for API handlers, which handle sending alerts to a user.
 * @class Notifier
 */
export class APIHandler {
  private packageName: string;

  private verbose: boolean;

  private gatewayVersion?: string;

  private userProfile?: UserProfile;

  private preferences?: Preferences;

  constructor(
    manager: AddonManagerProxy,
    packageName: string,
    { verbose }: Record<string, unknown> = {}
  ) {
    this.packageName = packageName;
    this.verbose = !!verbose;
    this.gatewayVersion = manager.getGatewayVersion();
    this.userProfile = manager.getUserProfile();
    this.preferences = manager.getPreferences();
  }

  isVerbose(): boolean {
    return this.verbose;
  }

  getPackageName(): string {
    return this.packageName;
  }

  getGatewayVersion(): string | undefined {
    return this.gatewayVersion;
  }

  getUserProfile(): UserProfile | undefined {
    return this.userProfile;
  }

  getPreferences(): Preferences | undefined {
    return this.preferences;
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
  async handleRequest(request: APIRequest): Promise<APIResponse> {
    if (this.verbose) {
      console.log(`New API request for ${this.packageName}:`, request);
    }

    return new APIResponse({ status: 404 });
  }

  /**
   * Unloads the handler.
   *
   * @returns a promise which resolves when the handler has finished unloading.
   */
  unload(): Promise<void> {
    if (this.verbose) {
      console.log('API Handler', this.packageName, 'unloaded');
    }

    return Promise.resolve();
  }
}
