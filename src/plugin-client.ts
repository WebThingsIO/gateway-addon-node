/**
 * @module PluginClient
 *
 * Takes care of connecting to the gateway for an adapter plugin
 */
/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { AddonManagerProxy } from './addon-manager-proxy';
import { MessageType } from './constants';
import { Deferred } from './deferred';
import { EventEmitter } from 'events';
import { IpcSocket } from './ipc';
import WebSocket from 'ws';
import { Message, PluginRegisterResponse, Preferences, UserProfile } from './schema';

export class PluginClient extends EventEmitter {
  private pluginId: string;

  private verbose: boolean;

  private deferredReply?: Deferred<AddonManagerProxy, void> | null;

  private logPrefix: string;

  private gatewayVersion?: string;

  private userProfile?: UserProfile;

  private preferences?: Preferences;

  private addonManager?: AddonManagerProxy;

  private ipcSocket?: IpcSocket;

  private ws?: WebSocket;

  constructor(pluginId: string, { verbose }: Record<string, unknown> = {}) {
    super();
    this.pluginId = pluginId;
    this.verbose = !!verbose;
    this.logPrefix = `PluginClient(${this.pluginId}):`;
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

  onMsg(genericMsg: Message): void {
    this.verbose && console.log(this.logPrefix, 'rcvd ManagerMsg:', genericMsg);

    if (genericMsg.messageType === MessageType.PLUGIN_REGISTER_RESPONSE) {
      const msg = <PluginRegisterResponse>genericMsg;
      this.gatewayVersion = msg.data.gatewayVersion;
      this.userProfile = msg.data.userProfile;
      this.preferences = msg.data.preferences;
      this.addonManager = new AddonManagerProxy(this);

      this.verbose && console.log(this.logPrefix, 'registered with PluginServer');

      if (this.deferredReply) {
        const deferredReply = this.deferredReply;
        this.deferredReply = null;
        deferredReply.resolve(this.addonManager);
      }
    } else if (this.addonManager) {
      this.addonManager.onMsg(genericMsg);
    }
  }

  register(port: number): Promise<AddonManagerProxy | void> {
    if (this.deferredReply) {
      console.error(this.logPrefix, 'Already waiting for registration reply');
      return Promise.resolve();
    }
    this.deferredReply = new Deferred();

    this.ipcSocket = new IpcSocket(
      false,
      port,
      this.onMsg.bind(this),
      `IpcSocket(${this.pluginId}):`,
      { verbose: this.verbose }
    );
    this.ipcSocket?.getConnectPromise()?.then((ws) => {
      this.ws = ws;

      // Register ourselves with the server
      this.verbose && console.log(this.logPrefix, 'Connected to server, registering...');

      this.sendNotification(MessageType.PLUGIN_REGISTER_REQUEST);
    });

    return this.deferredReply.getPromise();
  }

  sendNotification(messageType: number, data: Record<string, unknown> = {}): void {
    data.pluginId = this.pluginId;

    const jsonObj = JSON.stringify({ messageType, data });
    this.verbose && console.log(this.logPrefix, 'Sending:', jsonObj);
    this.ws?.send(jsonObj);
  }

  unload(): void {
    this.ipcSocket?.close();
    this.emit('unloaded', {});
  }
}
