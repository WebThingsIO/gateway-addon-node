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

/**
 * Base class for notifiers, which handle sending alerts to a user.
 * @class Notifier
 */
class Notifier {
  constructor(addonManager, id, packageName) {
    this.manager = addonManager;
    this.id = id;
    this.packageName = packageName;
    this.name = this.constructor.name;
    this.outlets = {};

    // We assume that the notifier is ready right away. If, for some reason a
    // particular notifier needs some time, then it should set ready to false
    // in its constructor.
    this.ready = true;

    this.gatewayVersion = addonManager.gatewayVersion;
    this.userProfile = addonManager.userProfile;
    this.preferences = addonManager.preferences;
  }

  dump() {
    console.log('Notifier:', this.name, '- dump() not implemented');
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

  getOutlet(id) {
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

  asDict() {
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
  handleOutletAdded(outlet) {
    this.outlets[outlet.id] = outlet;
    this.manager.handleOutletAdded(outlet);
  }

  /**
   * @method handleOutletRemoved
   *
   * Called to indicate that an outlet is no longer managed by this notifier.
   */
  handleOutletRemoved(outlet) {
    delete this.outlets[outlet.id];
    this.manager.handleOutletRemoved(outlet);
  }

  /**
   * Unloads a notifier.
   *
   * @returns a promise which resolves when the notifier has finished unloading.
   */
  unload() {
    console.log('Notifier:', this.name, 'unloaded');
    return Promise.resolve();
  }
}

module.exports = Notifier;
