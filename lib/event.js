/**
 * High-level Event base class implementation.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

'use strict';

const utils = require('./utils');

/**
 * An Event represents an individual event from a device.
 */
class Event {
  /**
   * Initialize the object.
   *
   * @param {Object} device Device this event belongs to
   * @param {String} name Name of the event
   * @param {*} data (Optional) Data associated with the event
   */
  constructor(device, name, data) {
    this.device = device;
    this.name = name;
    this.data = data || null;
    this.timestamp = utils.timestamp();
  }

  /**
   * Get the event description.
   *
   * @returns {Object} Description of the event as an object.
   */
  asEventDescription() {
    const description = {
      name: this.name,
      timestamp: this.timestamp,
    };

    if (this.data !== null) {
      description.data = this.data;
    }

    return description;
  }

  /**
   * Get the event description.
   *
   * @returns {Object} Description of the event as an object.
   */
  asDict() {
    return {
      name: this.name,
      data: this.data,
      timestamp: this.timestamp,
    };
  }

  /**
   * Get the device associated with this event.
   *
   * @returns {Object} The device.
   */
  getDevice() {
    return this.device;
  }

  /**
   * Get the event's name.
   *
   * @returns {String} The name.
   */
  getName() {
    return this.name;
  }

  /**
   * Get the event's data.
   *
   * @returns {*} The data.
   */
  getData() {
    return this.data;
  }

  /**
   * Get the event's timestamp.
   *
   * @returns {String} The time.
   */
  getTimestamp() {
    return this.timestamp;
  }
}

module.exports = Event;
