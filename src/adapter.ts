/**
 * @module Adapter base class.
 *
 * Manages Adapter data model and business logic.
 */
/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.*
 */

import { Action } from './action';
import { AddonManagerProxy } from './addon-manager-proxy';
import { Device } from './device';
import { DeviceWithoutId as DeviceWithoutIdSchema, Preferences, UserProfile } from './schema';

export interface AdapterDescription {
  id: string;
  name: string;
  ready: boolean;
}

/**
 * Base class for adapters, which manage devices.
 * @class Adapter
 *
 */
export class Adapter {
  private manager: AddonManagerProxy;

  private id: string;

  private packageName: string;

  private verbose: boolean;

  private name = this.constructor.name;

  private devices: Record<string, Device> = {};

  private actions: Record<string, Action> = {};

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

    // We assume that the adapter is ready right away. If, for some reason
    // a particular adapter (like ZWave) needs some time, then it should
    // set ready to false in its constructor.
    this.ready = true;

    this.gatewayVersion = manager.getGatewayVersion();
    this.userProfile = manager.getUserProfile();
    this.preferences = manager.getPreferences();
  }

  dump(): void {
    if (this.verbose) {
      console.log('Adapter:', this.name, '- dump() not implemented');
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

  getDevice(id: string): Device {
    return this.devices[id];
  }

  getDevices(): Record<string, Device> {
    return this.devices;
  }

  getActions(): Record<string, Action> {
    return this.actions;
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

  getManager(): AddonManagerProxy {
    return this.manager;
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

  asDict(): AdapterDescription {
    return {
      id: this.getId(),
      name: this.getName(),
      ready: this.isReady(),
    };
  }

  /**
   * @method handleDeviceAdded
   *
   * Called to indicate that a device is now being managed by this adapter.
   */
  handleDeviceAdded(device: Device): void {
    this.devices[device.getId()] = device;
    this.manager.handleDeviceAdded(device);
  }

  /**
   * @method handleDeviceRemoved
   *
   * Called to indicate that a device is no longer managed by this adapter.
   */
  handleDeviceRemoved(device: Device): void {
    delete this.devices[device.getId()];
    this.manager.handleDeviceRemoved(device);
  }

  /**
   * @method handleDeviceSaved
   *
   * Called to indicate that the user has saved a device to their gateway. This
   * is also called when the adapter starts up for every device which has
   * already been saved.
   *
   * This can be used for keeping track of what devices have previously been
   * discovered, such that the adapter can rebuild those, clean up old nodes,
   * etc.
   *
   * @param {string} deviceId - ID of the device
   * @param {object} device - the saved device description
   */
  handleDeviceSaved(_deviceId: string, _device: DeviceWithoutIdSchema): void {
    // pass
  }

  startPairing(_timeoutSeconds: number): void {
    if (this.verbose) {
      console.log('Adapter:', this.name, 'id', this.id, 'pairing started');
    }
  }

  /**
   * Send a prompt to the UI notifying the user to take some action.
   *
   * @param {string} prompt - The prompt to send
   * @param {string} url - URL to site with further explanation or
   *                 troubleshooting info
   * @param {Object?} device - Device the prompt is associated with
   */
  sendPairingPrompt(prompt: string, url?: string, device?: Device): void {
    this.manager.sendPairingPrompt(this, prompt, url, device);
  }

  /**
   * Send a prompt to the UI notifying the user to take some action.
   *
   * @param {string} prompt - The prompt to send
   * @param {string} url - URL to site with further explanation or
   *                 troubleshooting info
   * @param {Object?} device - Device the prompt is associated with
   */
  sendUnpairingPrompt(prompt: string, url?: string, device?: Device): void {
    this.manager.sendUnpairingPrompt(this, prompt, url, device);
  }

  cancelPairing(): void {
    if (this.verbose) {
      console.log('Adapter:', this.name, 'id', this.id, 'pairing cancelled');
    }
  }

  removeThing(device: Device): void {
    if (this.verbose) {
      console.log(
        'Adapter:',
        this.name,
        'id',
        this.id,
        'removeThing(',
        device.getId(),
        ') started'
      );
    }

    this.handleDeviceRemoved(device);
  }

  cancelRemoveThing(device: Device): void {
    if (this.verbose) {
      console.log('Adapter:', this.name, 'id', this.id, 'cancelRemoveThing(', device.getId(), ')');
    }
  }

  /**
   * Unloads an adapter.
   *
   * @returns a promise which resolves when the adapter has finished unloading.
   */
  unload(): Promise<void> {
    if (this.verbose) {
      console.log('Adapter:', this.name, 'unloaded');
    }

    return Promise.resolve();
  }

  /**
   * Set the PIN for the given device.
   *
   * @param {String} deviceId ID of device
   * @param {String} pin PIN to set
   *
   * @returns a promise which resolves when the PIN has been set.
   */
  setPin(deviceId: string, pin: string): Promise<void> {
    const device = this.getDevice(deviceId);
    if (device) {
      if (this.verbose) {
        console.log('Adapter:', this.name, 'id', this.id, 'setPin(', deviceId, ',', pin, ')');
      }

      return Promise.resolve();
    }

    return Promise.reject('Device not found');
  }

  /**
   * Set the username and password for the given device.
   *
   * @param {String} deviceId ID of device
   * @param {String} username Username to set
   * @param {String} password Password to set
   *
   * @returns a promise which resolves when the credentials have been set.
   */
  setCredentials(deviceId: string, username: string, password: string): Promise<void> {
    const device = this.getDevice(deviceId);
    if (device) {
      if (this.verbose) {
        console.log(
          'Adapter:',
          this.name,
          'id',
          this.id,
          'setCredentials(',
          deviceId,
          ',',
          username,
          ',',
          password,
          ')'
        );
      }

      return Promise.resolve();
    }

    return Promise.reject('Device not found');
  }
}
