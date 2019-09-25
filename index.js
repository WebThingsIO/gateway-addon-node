/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.*
 */

'use strict';

const Action = require('./lib/action');
const Adapter = require('./lib/adapter');
const AddonManagerProxy = require('./lib/addon-manager-proxy');
const {APIHandler, APIRequest, APIResponse} = require('./lib/api-handler');
const Constants = require('./lib/constants');
const Database = require('./lib/database');
const Deferred = require('./lib/deferred');
const Device = require('./lib/device');
const Event = require('./lib/event');
const IpcSocket = require('./lib/ipc');
const Notifier = require('./lib/notifier');
const Outlet = require('./lib/outlet');
const PluginClient = require('./lib/plugin-client');
const Property = require('./lib/property');
const Utils = require('./lib/utils');

module.exports = {
  Action,
  Adapter,
  AddonManagerProxy,
  APIHandler,
  APIRequest,
  APIResponse,
  Constants,
  Database,
  Deferred,
  Device,
  Event,
  IpcSocket,
  Notifier,
  Outlet,
  PluginClient,
  Property,
  Utils,
  getVersion: () => require('./package.json').version,
};
