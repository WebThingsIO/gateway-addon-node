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

'use strict';

import { AddonManagerProxy } from './addon-manager-proxy';
import { MessageType } from './constants';
import { Deferred } from './deferred';
import { EventEmitter } from 'events';
import { IpcSocket } from './ipc';
import WebSocket from 'ws';

export class PluginClient extends EventEmitter {
  private verbose: boolean;
  private deferredReply?: Deferred<AddonManagerProxy, void>;
  private logPrefix: string;
  private gatewayVersion?: string;
  private userProfile: any;
  private preferences: any;
  private addonManager?: AddonManagerProxy;
  private ipcSocket?: IpcSocket;
  private ws?: WebSocket;

  constructor(private pluginId: string, { verbose }: any = {}) {
    super();
    this.verbose = !!verbose;
    this.logPrefix = `PluginClient(${this.pluginId}):`;
  }

  getGatewayVersion() {
    return this.gatewayVersion;
  }

  getUserProfile() {
    return this.userProfile;
  }

  getPreferences() {
    return this.preferences;
  }

  onMsg(msg: any) {
    this.verbose &&
      console.log(this.logPrefix, 'rcvd ManagerMsg:', msg);

    if (msg.messageType === (<any>MessageType).PLUGIN_REGISTER_RESPONSE) {
      this.gatewayVersion = msg.data.gatewayVersion;
      this.userProfile = msg.data.userProfile;
      this.preferences = msg.data.preferences;
      this.addonManager = new AddonManagerProxy(this);

      this.verbose &&
        console.log(this.logPrefix, 'registered with PluginServer');

      if (this.deferredReply) {
        const deferredReply = this.deferredReply;
        this.deferredReply = undefined;
        deferredReply.resolve(this.addonManager);
      }
    } else if (this.addonManager) {
      this.addonManager.onMsg(msg);
    }
  }

  register(port: number) {
    if (this.deferredReply) {
      console.error(this.logPrefix, 'Already waiting for registration reply');
      return;
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
      this.verbose &&
        console.log(this.logPrefix, 'Connected to server, registering...');

      this.sendNotification((<any>MessageType).PLUGIN_REGISTER_REQUEST);
    });

    return this.deferredReply.getPromise();
  }

  sendNotification(messageType: string, data: any = {}) {
    data.pluginId = this.pluginId;

    const jsonObj = JSON.stringify({ messageType, data });
    this.verbose && console.log(this.logPrefix, 'Sending:', jsonObj);
    this.ws?.send(jsonObj);
  }

  unload() {
    this.ipcSocket?.close();
    this.emit('unloaded', {});
  }
}
