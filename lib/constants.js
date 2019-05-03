/*
 * WebThings Gateway Constants.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

'use strict';

// Plugin and REST/websocket API things
exports.DONT_RESTART_EXIT_CODE = 100;
exports.UNLOAD_PLUGIN_KILL_DELAY = 3000;
exports.ACTION_STATUS = 'actionStatus';
exports.ADAPTER_ADDED = 'adapterAdded';
exports.ADAPTER_UNLOADED = 'adapterUnloaded';
exports.ADD_ADAPTER = 'addAdapter';
exports.ADD_NOTIFIER = 'addNotifier';
exports.ADD_EVENT_SUBSCRIPTION = 'addEventSubscription';
exports.ADD_MOCK_DEVICE = 'addMockDevice';
exports.CANCEL_PAIRING = 'cancelPairing';
exports.CANCEL_REMOVE_THING = 'cancelRemoveThing';
exports.CLEAR_MOCK_ADAPTER_STATE = 'clearMockAdapterState';
exports.CONNECTED = 'connected';
exports.DEBUG_CMD = 'debugCmd';
exports.EVENT = 'event';
exports.ERROR = 'error';
exports.HANDLE_DEVICE_ADDED = 'handleDeviceAdded';
exports.HANDLE_DEVICE_REMOVED = 'handleDeviceRemoved';
exports.HANDLE_OUTLET_ADDED = 'handleOutletAdded';
exports.HANDLE_OUTLET_REMOVED = 'handleOutletRemoved';
exports.MOCK_ADAPTER_STATE_CLEARED = 'mockAdapterStateCleared';
exports.MOCK_DEVICE_ADDED_REMOVED = 'mockDeviceAddedRemoved';
exports.MOCK_DEVICE_ADD_REMOVE_FAILED = 'mockDeviceAddRemoveFailed';
exports.NOTIFY = 'notify';
exports.NOTIFY_REJECTED = 'notifyRejected';
exports.NOTIFY_RESOLVED = 'notifyResolved';
exports.NOTIFIER_ADDED = 'notifierAdded';
exports.NOTIFIER_UNLOADED = 'notifierUnloaded';
exports.PAIRING_TIMEOUT = 'pairingTimeout';
exports.PAIR_MOCK_DEVICE = 'pairMockDevice';
exports.PAIRING_PROMPT = 'pairingPrompt';
exports.PLUGIN_UNLOADED = 'pluginUnloaded';
exports.PROPERTY_CHANGED = 'propertyChanged';
exports.PROPERTY_STATUS = 'propertyStatus';
exports.REGISTER_PLUGIN = 'registerPlugin';
exports.REGISTER_PLUGIN_REPLY = 'registerPluginReply';
exports.REMOVE_ACTION = 'removeAction';
exports.REMOVE_ACTION_REJECTED = 'removeActionRejected';
exports.REMOVE_ACTION_RESOLVED = 'removeActionResolved';
exports.REMOVE_THING = 'removeThing';
exports.REQUEST_ACTION = 'requestAction';
exports.REQUEST_ACTION_REJECTED = 'requestActionRejected';
exports.REQUEST_ACTION_RESOLVED = 'requestActionResolved';
exports.SET_PIN = 'setPin';
exports.SET_PIN_REJECTED = 'setPinRejected';
exports.SET_PIN_RESOLVED = 'setPinResolved';
exports.SET_CREDENTIALS = 'setCredentials';
exports.SET_CREDENTIALS_REJECTED = 'setCredentialsRejected';
exports.SET_CREDENTIALS_RESOLVED = 'setCredentialsResolved';
exports.SET_PROPERTY = 'setProperty';
exports.START_PAIRING = 'startPairing';
exports.THING_ADDED = 'thingAdded';
exports.THING_REMOVED = 'thingRemoved';
exports.UNLOAD_ADAPTER = 'unloadAdapter';
exports.UNLOAD_NOTIFIER = 'unloadNotifier';
exports.UNLOAD_PLUGIN = 'unloadPlugin';
exports.UNPAIR_MOCK_DEVICE = 'unpairMockDevice';
exports.UNPAIRING_PROMPT = 'unpairingPrompt';

// Thing types
exports.THING_TYPE_ON_OFF_SWITCH = 'onOffSwitch';
exports.THING_TYPE_MULTI_LEVEL_SWITCH = 'multiLevelSwitch';
exports.THING_TYPE_BINARY_SENSOR = 'binarySensor';
exports.THING_TYPE_MULTI_LEVEL_SENSOR = 'multiLevelSensor';
exports.THING_TYPE_SMART_PLUG = 'smartPlug';
exports.THING_TYPE_ON_OFF_LIGHT = 'onOffLight';
exports.THING_TYPE_DIMMABLE_LIGHT = 'dimmableLight';
exports.THING_TYPE_ON_OFF_COLOR_LIGHT = 'onOffColorLight';
exports.THING_TYPE_DIMMABLE_COLOR_LIGHT = 'dimmableColorLight';

exports.NotificationLevel = {
  LOW: 0,
  NORMAL: 1,
  HIGH: 2,
};
