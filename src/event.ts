/**
 * High-level Event base class implementation.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

'use strict';

import {Device} from './device';

import {timestamp} from './utils';

export interface EventDescription {
  name: string;
  data?: unknown;
  timestamp: string;
}

/**
 * An Event represents an individual event from a device.
 */
export class Event {
  private device: Device;

  private name: string;

  private data?: unknown;

  private timestamp = timestamp();

  /**
   * Initialize the object.
   *
   * @param {Object} device Device this event belongs to
   * @param {String} name Name of the event
   * @param {*} data (Optional) Data associated with the event
   */
  constructor(device: Device, name: string, data?: unknown) {
    this.device = device;
    this.name = name;
    this.data = data;
  }

  getDevice(): Device {
    return this.device;
  }

  /**
   * Get the event description.
   *
   * @returns {Object} Description of the event as an object.
   */
  asEventDescription(): EventDescription {
    const description: EventDescription = {
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
