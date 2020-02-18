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

const AddonManagerProxy = require('./addon-manager-proxy');
const {MessageType} = require('./constants');
const Deferred = require('./deferred');
const EventEmitter = require('events');
const IpcSocket = require('./ipc');

class PluginClient extends EventEmitter {
  constructor(pluginId, {verbose} = {}) {
    super();
    this.pluginId = pluginId;
    this.verbose = verbose;
    this.deferredReply = null;
    this.logPrefix = `PluginClient(${this.pluginId}):`;
  }

  onMsg(msg) {
    this.verbose &&
      console.log(this.logPrefix, 'rcvd ManagerMsg:', msg);

    if (msg.messageType === MessageType.PLUGIN_REGISTER_RESPONSE) {
      this.gatewayVersion = msg.data.gatewayVersion;
      this.userProfile = msg.data.userProfile;
      this.preferences = msg.data.preferences;
      this.addonManager = new AddonManagerProxy(this);

      this.verbose &&
        console.log(this.logPrefix, 'registered with PluginServer');

      if (this.deferredReply) {
        const deferredReply = this.deferredReply;
        this.deferredReply = null;
        deferredReply.resolve(this.addonManager);
      }
    } else if (this.addonManager) {
      this.addonManager.onMsg(msg);
    }
  }

  register(port) {
    if (this.deferredReply) {
      console.error(this.logPrefix, 'Already waiting for registration reply');
      return;
    }
    this.deferredReply = new Deferred();

    this.ipcSocket = new IpcSocket(
      false,
      port,
      this.onMsg.bind(this),
      `IpcSocket(${this.pluginId}):`
    );
    this.ipcSocket.connectPromise.then((ws) => {
      this.ws = ws;

      // Register ourselves with the server
      this.verbose &&
        console.log(this.logPrefix, 'Connected to server, registering...');

      this.sendNotification(MessageType.PLUGIN_REGISTER_REQUEST);
    });

    return this.deferredReply.promise;
  }

  sendNotification(messageType, data = {}) {
    data.pluginId = this.pluginId;

    const jsonObj = JSON.stringify({messageType, data});
    this.verbose && console.log(this.logPrefix, 'Sending:', jsonObj);
    this.ws.send(jsonObj);
  }

  unload() {
    this.ipcSocket.close();
    this.emit('unloaded', {});
  }
}

module.exports = PluginClient;
