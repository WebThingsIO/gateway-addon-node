/**
 * @module Notifier base class.
 *
 * Manages Notifier data model and business logic.
 */
/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.*
 */

'use strict';

import { AddonManagerProxy } from "./addon-manager-proxy";
import { Outlet } from "./outlet";

export interface NotifierDescription {
  id: string,
  name: string
  ready: boolean,
}

/**
 * Base class for notifiers, which handle sending alerts to a user.
 * @class Notifier
 */
export class Notifier {
  private verbose: boolean;
  private name = this.constructor.name;
  private outlets: { [key: string]: Outlet } = {};
  private ready: boolean;
  private gatewayVersion: string;
  private userProfile: any;
  private preferences: any;

  constructor(private manager: AddonManagerProxy, private id: string, private packageName: string, { verbose }: any = {}) {
    this.verbose = !!verbose;
    this.name = this.constructor.name;
    this.outlets = {};

    // We assume that the notifier is ready right away. If, for some reason a
    // particular notifier needs some time, then it should set ready to false
    // in its constructor.
    this.ready = true;

    this.gatewayVersion = manager.gatewayVersion;
    this.userProfile = manager.userProfile;
    this.preferences = manager.preferences;
  }

  dump() {
    if (this.verbose) {
      console.log('Notifier:', this.name, '- dump() not implemented');
    }
  }

  /**
   * @method getId
   * @returns the id of this adapter.
   */
  getId() {
    return this.id;
  }

  getPackageName() {
    return this.packageName;
  }

  getOutlet(id: string) {
    return this.outlets[id];
  }

  getOutlets() {
    return this.outlets;
  }

  getName() {
    return this.name;
  }

  isReady() {
    return this.ready;
  }

  isVerbose() {
    return this.verbose;
  }

  getGatewayVersion() {
    return this.gatewayVersion;
  }

  getUserProfile() {
    return this.userProfile;
  }

  getPreferences() {
    return this.preferences;
  }

  asDict(): NotifierDescription {
    return {
      id: this.getId(),
      name: this.getName(),
      ready: this.isReady(),
    };
  }

  /**
   * @method handleOutletAdded
   *
   * Called to indicate that an outlet is now being managed by this notifier.
   */
  handleOutletAdded(outlet: Outlet) {
    this.outlets[outlet.getId()] = outlet;
    this.manager.handleOutletAdded(outlet);
  }

  /**
   * @method handleOutletRemoved
   *
   * Called to indicate that an outlet is no longer managed by this notifier.
   */
  handleOutletRemoved(outlet: Outlet) {
    delete this.outlets[outlet.getId()];
    this.manager.handleOutletRemoved(outlet);
  }

  /**
   * Unloads a notifier.
   *
   * @returns a promise which resolves when the notifier has finished unloading.
   */
  unload() {
    if (this.verbose) {
      console.log('Notifier:', this.name, 'unloaded');
    }

    return Promise.resolve();
  }
}
