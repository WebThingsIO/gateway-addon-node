/**
 * High-level Event base class implementation.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

'use strict';

import { Device } from "./device";

const utils = require('./utils');

export interface EventDescription {
  name: string,
  data: any,
  timestamp: string
}

/**
 * An Event represents an individual event from a device.
 */
export class Event {
  private timestamp = utils.timestamp();

  /**
   * Initialize the object.
   *
   * @param {Object} device Device this event belongs to
   * @param {String} name Name of the event
   * @param {*} data (Optional) Data associated with the event
   */
  constructor(private device: Device, private name: string, private data?: any) {
  }

  getDevice() {
    return this.device;
  }

  /**
   * Get the event description.
   *
   * @returns {Object} Description of the event as an object.
   */
  asEventDescription(): EventDescription {
    const description: any = {
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
  asDict(): EventDescription {
    return {
      name: this.name,
      data: this.data,
      timestamp: this.timestamp,
    };
  }
}
