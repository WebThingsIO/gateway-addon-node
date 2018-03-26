/**
 * High-level Action base class implementation.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

'use strict';

const utils = require('./utils');

/**
 * An Action represents an individual action on a device.
 */
class Action {
  constructor(id, device, name, input) {
    /**
     * Initialize the object.
     *
     * @param {String} id ID of this action
     * @param {Object} device Device this action belongs to
     * @param {String} name Name of the action
     * @param {Object} input Any action inputs
     */
    this.id = id;
    this.device = device;
    this.name = name;
    this.input = input;
    this.status = 'created';
    this.timeRequested = utils.timestamp();
    this.timeCompleted = null;
  }

  /**
   * Get the action description.
   *
   * @returns {Object} Description of the action as an object.
   */
  asActionDescription() {
    const description = {
      name: this.name,
      timeRequested: this.timeRequested,
      status: this.status,
    };

    if (this.input !== null) {
      description.input = this.input;
    }

    if (this.timeCompleted !== null) {
      description.timeCompleted = this.timeCompleted;
    }

    return description;
  }

  /**
   * Get the action description.
   *
   * @returns {Object} Description of the action as an object.
   */
  asDict() {
    return {
      id: this.id,
      name: this.name,
      input: this.input,
      status: this.status,
      timeRequested: this.timeRequested,
      timeCompleted: this.timeCompleted,
    };
  }

  /**
   * Get this action's ID.
   *
   * @returns {String} The ID.
   */
  getId() {
    return this.id;
  }

  /**
   * Get this action's name.
   *
   * @returns {String} The name.
   */
  getName() {
    return this.name;
  }

  /**
   * Get this action's status.
   *
   * @returns {String} The status.
   */
  getStatus() {
    return this.status;
  }

  /**
   * Get the device associated with this action.
   *
   * @returns {Object} The device.
   */
  getDevice() {
    return this.device;
  }

  /**
   * Get the time the action was requested.
   *
   * @returns {String} The time.
   */
  getTimeRequested() {
    return this.timeRequested;
  }

  /**
   * Get the time the action was completed.
   *
   * @returns {String} The time.
   */
  getTimeCompleted() {
    return this.timeCompleted;
  }

  /**
   * Get the inputs for this action.
   *
   * @returns {Object} The inputs.
   */
  getInput() {
    return this.input;
  }

  /**
   * Start performing the action.
   */
  start() {
    this.status = 'pending';
    this.device.actionNotify(this);
  }

  /**
   * Finish performing the action.
   */
  finish() {
    this.status = 'completed';
    this.timeCompleted = utils.timestamp();
    this.device.actionNotify(this);
  }
}

module.exports = Action;
