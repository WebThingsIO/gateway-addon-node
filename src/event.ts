/**
 * High-level Event base class implementation.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { Device } from './device';
import { Any, EventDescription1 } from './schema';

import { timestamp } from './utils';

/**
 * An Event represents an individual event from a device.
 */
export class Event {
  private device: Device;

  private name: string;

  private data?: Any;

  private timestamp = timestamp();

  /**
   * Initialize the object.
   *
   * @param {Object} device Device this event belongs to
   * @param {String} name Name of the event
   * @param {*} data (Optional) Data associated with the event
   */
  constructor(device: Device, name: string, data?: Any) {
    this.device = device;
    this.name = name;
    this.data = data;
  }

  getDevice(): Device {
    return this.device;
  }

  getName(): string {
    return this.name;
  }

  getData(): Any | undefined {
    return this.data;
  }

  getTimestamp(): string {
    return this.timestamp;
  }

  /**
   * Get the event description.
   *
   * @returns {Object} Description of the event as an object.
   */
  asEventDescription(): EventDescription1 {
    const description: EventDescription1 = {
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
  asDict(): EventDescription1 {
    return {
      name: this.name,
      data: this.data,
      timestamp: this.timestamp,
    };
  }
}
