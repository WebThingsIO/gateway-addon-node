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

import { AddonManagerProxy } from './addon-manager-proxy';
import { Outlet } from './outlet';
import { Preferences, UserProfile } from './schema';

export interface NotifierDescription {
  id: string;
  name: string;
  ready: boolean;
}

/**
 * Base class for notifiers, which handle sending alerts to a user.
 * @class Notifier
 */
export class Notifier {
  private manager: AddonManagerProxy;

  private id: string;

  private packageName: string;

  private verbose: boolean;

  private name = this.constructor.name;

  private outlets: Record<string, Outlet> = {};

  private ready: boolean;

  private gatewayVersion?: string;

  private userProfile?: UserProfile;

  private preferences?: Preferences;

  constructor(
    manager: AddonManagerProxy,
    id: string,
    packageName: string,
    { verbose }: Record<string, unknown> = {}
  ) {
    this.manager = manager;
    this.id = id;
    this.packageName = packageName;
    this.verbose = !!verbose;
    this.outlets = {};

    // We assume that the notifier is ready right away. If, for some reason a
    // particular notifier needs some time, then it should set ready to false
    // in its constructor.
    this.ready = true;

    this.gatewayVersion = manager.getGatewayVersion();
    this.userProfile = manager.getUserProfile();
    this.preferences = manager.getPreferences();
  }

  dump(): void {
    if (this.verbose) {
      console.log('Notifier:', this.name, '- dump() not implemented');
    }
  }

  /**
   * @method getId
   * @returns the id of this adapter.
   */
  getId(): string {
    return this.id;
  }

  getPackageName(): string {
    return this.packageName;
  }

  getOutlet(id: string): Outlet {
    return this.outlets[id];
  }

  getOutlets(): Record<string, Outlet> {
    return this.outlets;
  }

  getName(): string {
    return this.name;
  }

  setName(name: string): void {
    this.name = name;
  }

  isReady(): boolean {
    return this.ready;
  }

  setReady(ready: boolean): void {
    this.ready = ready;
  }

  isVerbose(): boolean {
    return this.verbose;
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
  handleOutletAdded(outlet: Outlet): void {
    this.outlets[outlet.getId()] = outlet;
    this.manager.handleOutletAdded(outlet);
  }

  /**
   * @method handleOutletRemoved
   *
   * Called to indicate that an outlet is no longer managed by this notifier.
   */
  handleOutletRemoved(outlet: Outlet): void {
    delete this.outlets[outlet.getId()];
    this.manager.handleOutletRemoved(outlet);
  }

  /**
   * Unloads a notifier.
   *
   * @returns a promise which resolves when the notifier has finished unloading.
   */
  unload(): Promise<void> {
    if (this.verbose) {
      console.log('Notifier:', this.name, 'unloaded');
    }

    return Promise.resolve();
  }
}
