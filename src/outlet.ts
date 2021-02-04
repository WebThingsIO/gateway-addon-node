/**
 * Outlet Model.
 *
 * Abstract base class for outlets managed by a notifier.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { Notifier } from './notifier';
import { Level, OutletDescription } from './schema';

export class Outlet {
  private notifier: Notifier;

  private id: string;

  private name = '';

  constructor(notifier: Notifier, id: string) {
    this.notifier = notifier;
    this.id = `${id}`;
  }

  asDict(): OutletDescription {
    return {
      id: this.id,
      name: this.name,
    };
  }

  getId(): string {
    return this.id;
  }

  getName(): string {
    return this.name;
  }

  setName(name: string): void {
    this.name = name;
  }

  getNotifier(): Notifier {
    return this.notifier;
  }

  /**
   * Notify the user.
   *
   * @param {string} title Title of notification.
   * @param {string} message Message of notification.
   * @param {number} level Alert level.
   * @returns {Promise} Promise which resolves when the user has been notified.
   */
  notify(title: string, message: string, level: Level): Promise<void> {
    if (this.notifier.isVerbose()) {
      console.log(`Outlet: ${this.name} notify("${title}", "${message}", ${level})`);
    }

    return Promise.resolve();
  }
}
