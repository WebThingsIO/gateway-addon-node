/**
 * High-level Action base class implementation.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { Device } from './device';
import { ActionDescription, Any } from './schema';
import { timestamp } from './utils';

/**
 * An Action represents an individual action on a device.
 */
export class Action {
  private status = 'created';

  private timeRequested = timestamp();

  private timeCompleted?: string;

  private id: string;

  public device: Device;

  private name: string;

  private input?: Any;

  /**
   * Initialize the object.
   *
   * @param {String} id ID of this action
   * @param {Object} device Device this action belongs to
   * @param {String} name Name of the action
   * @param {unknown} input Any action inputs
   */
  constructor(id: string, device: Device, name: string, input?: Any) {
    this.id = id;
    this.device = device;
    this.name = name;
    this.input = input;
  }

  getId(): string {
    return this.id;
  }

  getName(): string {
    return this.name;
  }

  getInput(): Any | undefined {
    return this.input;
  }

  /**
   * Get the action description.
   *
   * @returns {Object} Description of the action as an object.
   */
  asActionDescription(): ActionDescription {
    const description: ActionDescription = {
      id: this.id,
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
  asDict(): ActionDescription {
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
   * Start performing the action.
   */
  start(): void {
    this.status = 'pending';
    this.device.actionNotify(this);
  }

  /**
   * Finish performing the action.
   */
  finish(): void {
    this.status = 'completed';
    this.timeCompleted = timestamp();
    this.device.actionNotify(this);
  }
}
