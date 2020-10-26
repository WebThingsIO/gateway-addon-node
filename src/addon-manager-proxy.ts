/**
 * Proxy version of AddonManager used by plugins.
 *
 * @module AddonManagerProxy
 */
/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

'use strict';

import { Action } from "./action";
import { Adapter } from "./adapter";
import { APIHandler } from "./api-handler";
import { Device } from "./device";
import { Event } from "./event";
import { Notifier } from "./notifier";
import { Outlet } from "./outlet";
import { PluginClient } from "./plugin-client";
import { Property } from "./property";

const { APIRequest, APIResponse } = require('./api-handler');
const { MessageType } = require('./constants');
const EventEmitter = require('events').EventEmitter;

interface MockAdapter {
  clearState(): Promise<void>;
  addDevice(deviceId: string, deviceDescr: any): Promise<any>;
  removeDevice(deviceId: string): Promise<any>;
  pairDevice(deviceId: string, deviceDescr: any): Promise<void>;
  unpairDevice(deviceId: string): Promise<void>;
}

export class AddonManagerProxy extends EventEmitter {
  private adapters = new Map<string, Adapter>();
  private notifiers = new Map<string, Notifier>();
  private apiHandlers = new Map<string, APIHandler>();
  private onUnload?: () => void;


  constructor(private pluginClient: PluginClient, { verbose }: any = {}) {
    super();

    this.gatewayVersion = pluginClient.getGatewayVersion();
    this.userProfile = pluginClient.getUserProfile();
    this.preferences = pluginClient.getUserProfile();
    this.verbose = !!verbose;
  }

  /**
   * @method addAdapter
   *
   * Adds an adapter to the collection of adapters managed by AddonManager.
   */
  addAdapter(adapter: Adapter) {
    const adapterId = adapter.getId();
    this.verbose && console.log('AddonManagerProxy: addAdapter:', adapterId);

    this.adapters.set(adapterId, adapter);
    this.pluginClient.sendNotification(
      MessageType.ADAPTER_ADDED_NOTIFICATION,
      {
        adapterId: adapter.getId(),
        name: adapter.getName(),
        packageName: adapter.getPackageName(),
      }
    );
  }

  /**
   * @method addNotifier
   *
   * Adds a notifier to the collection of notifiers managed by AddonManager.
   */
  addNotifier(notifier: Notifier) {
    const notifierId = notifier.getId();
    this.verbose && console.log('AddonManagerProxy: addNotifier:', notifierId);

    this.notifiers.set(notifierId, notifier);
    this.pluginClient.sendNotification(
      MessageType.NOTIFIER_ADDED_NOTIFICATION,
      {
        notifierId: notifier.getId(),
        name: notifier.getName(),
        packageName: notifier.getPackageName(),
      }
    );
  }

  /**
   * @method addAPIHandler
   *
   * Adds a new API handler.
   */
  addAPIHandler(handler: APIHandler) {
    const packageName = handler.getPackageName();
    this.verbose &&
      console.log('AddonManagerProxy: addAPIHandler:', packageName);

    this.apiHandlers.set(packageName, handler);
    this.pluginClient.sendNotification(
      MessageType.API_HANDLER_ADDED_NOTIFICATION,
      {
        packageName,
      }
    );
  }

  /**
   * @method handleDeviceAdded
   *
   * Called when the indicated device has been added to an adapter.
   */
  handleDeviceAdded(device: Device) {
    this.verbose &&
      console.log('AddonManagerProxy: handleDeviceAdded:', device.getId());
    const data = {
      adapterId: device.getAdapter().getId(),
      device: device.asDict(),
    };
    this.pluginClient.sendNotification(
      MessageType.DEVICE_ADDED_NOTIFICATION,
      data
    );
  }

  /**
   * @method handleDeviceRemoved
   * Called when the indicated device has been removed from an adapter.
   */
  handleDeviceRemoved(device: Device) {
    this.verbose &&
      console.log('AddonManagerProxy: handleDeviceRemoved:', device.getId());
    this.pluginClient.sendNotification(
      MessageType.ADAPTER_REMOVE_DEVICE_RESPONSE,
      {
        adapterId: device.getAdapter().getId(),
        deviceId: device.getId(),
      }
    );
  }

  /**
   * @method handleOutletAdded
   *
   * Called when the indicated outlet has been added to a notifier.
   */
  handleOutletAdded(outlet: Outlet) {
    this.verbose &&
      console.log('AddonManagerProxy: handleOutletAdded:', outlet.getId());
    const data = {
      notifierId: outlet.getNotifier().getId(),
      outlet: outlet.asDict(),
    };
    this.pluginClient.sendNotification(
      MessageType.OUTLET_ADDED_NOTIFICATION,
      data
    );
  }

  /**
   * @method handleOutletRemoved
   * Called when the indicated outlet has been removed from a notifier.
   */
  handleOutletRemoved(outlet: Outlet) {
    this.verbose &&
      console.log('AddonManagerProxy: handleOutletRemoved:', outlet.getId());
    this.pluginClient.sendNotification(
      MessageType.OUTLET_REMOVED_NOTIFICATION,
      {
        notifierId: outlet.getNotifier().getId(),
        outletId: outlet.getId(),
      }
    );
  }

  /**
   * @method onMsg
   * Called whenever a message is received from the gateway.
   */
  onMsg(msg: any) {
    this.verbose && console.log('AddonManagerProxy: Rcvd:', msg);

    switch (msg.messageType) {
      case MessageType.PLUGIN_UNLOAD_REQUEST:
        this.unloadPlugin();
        return;

      case MessageType.API_HANDLER_UNLOAD_REQUEST: {
        const packageName = msg.data.packageName;
        const handler = this.apiHandlers.get(packageName);
        if (!handler) {
          console.error(
            'AddonManagerProxy: Unrecognized handler:',
            packageName
          );
          console.error('AddonManagerProxy: Ignoring msg:', msg);
          return;
        }

        handler.unload().then(() => {
          this.apiHandlers.delete(packageName);
          this.pluginClient.sendNotification(
            MessageType.API_HANDLER_UNLOAD_RESPONSE,
            {
              packageName,
            }
          );
        });
        return;
      }
      case MessageType.API_HANDLER_API_REQUEST: {
        const packageName = msg.data.packageName;
        const handler = this.apiHandlers.get(packageName);
        if (!handler) {
          console.error(
            'AddonManagerProxy: Unrecognized handler:',
            packageName
          );
          console.error('AddonManagerProxy: Ignoring msg:', msg);
          return;
        }

        const request = new APIRequest(msg.data.request);
        handler.handleRequest(request)
          .then((response) => {
            this.pluginClient.sendNotification(
              MessageType.API_HANDLER_API_RESPONSE,
              {
                packageName: packageName,
                messageId: msg.data.messageId,
                response,
              }
            );
          }).catch((err) => {
            console.error(
              'AddonManagerProxy: Failed to handle API request:',
              err
            );
            this.pluginClient.sendNotification(
              MessageType.API_HANDLER_API_RESPONSE,
              {
                packageName: packageName,
                messageId: msg.data.messageId,
                response: new APIResponse({
                  status: 500,
                  contentType: 'text/plain',
                  content: `${err}`,
                }),
              }
            );
          });
        return;
      }
    }

    // Next, handle notifier messages.
    if (msg.data.hasOwnProperty('notifierId')) {
      const notifierId = msg.data.notifierId;
      const notifier = this.notifiers.get(notifierId);
      if (!notifier) {
        console.error('AddonManagerProxy: Unrecognized notifier:', notifierId);
        console.error('AddonManagerProxy: Ignoring msg:', msg);
        return;
      }

      switch (msg.messageType) {
        case MessageType.NOTIFIER_UNLOAD_REQUEST:
          notifier.unload().then(() => {
            this.notifiers.delete(notifierId);
            this.pluginClient.sendNotification(
              MessageType.NOTIFIER_UNLOAD_RESPONSE,
              {
                notifierId: notifier.getId(),
              }
            );
          });
          break;
        case MessageType.OUTLET_NOTIFY_REQUEST: {
          const outletId = msg.data.outletId;
          const outlet = notifier.getOutlet(outletId);
          if (!outlet) {
            console.error('AddonManagerProxy: No such outlet:', outletId);
            console.error('AddonManagerProxy: Ignoring msg:', msg);
            return;
          }

          outlet.notify(msg.data.title, msg.data.message, msg.data.level)
            .then(() => {
              this.pluginClient.sendNotification(
                MessageType.OUTLET_NOTIFY_RESPONSE,
                {
                  notifierId: notifierId,
                  outletId: outletId,
                  messageId: msg.data.messageId,
                  success: true,
                }
              );
            }).catch((err) => {
              console.error('AddonManagerProxy: Failed to notify outlet:', err);
              this.pluginClient.sendNotification(
                MessageType.OUTLET_NOTIFY_RESPONSE,
                {
                  notifierId: notifierId,
                  outletId: outletId,
                  messageId: msg.data.messageId,
                  success: false,
                }
              );
            });
          break;
        }
      }

      return;
    }

    // The next switch covers adapter messages. i.e. don't have a deviceId.
    // or don't need a device object.

    const adapterId = msg.data.adapterId;
    const adapter: (MockAdapter & Adapter) | undefined = <MockAdapter & Adapter>this.adapters.get(adapterId);
    if (!adapter) {
      console.error('AddonManagerProxy: Unrecognized adapter:', adapterId);
      console.error('AddonManagerProxy: Ignoring msg:', msg);
      return;
    }

    switch (msg.messageType) {

      case MessageType.ADAPTER_START_PAIRING_COMMAND:
        adapter.startPairing(msg.data.timeout);
        return;

      case MessageType.ADAPTER_CANCEL_PAIRING_COMMAND:
        adapter.cancelPairing();
        return;

      case MessageType.ADAPTER_UNLOAD_REQUEST:
        adapter.unload().then(() => {
          this.adapters.delete(adapterId);
          this.pluginClient.sendNotification(
            MessageType.ADAPTER_UNLOAD_RESPONSE,
            {
              adapterId: adapter.getId(),
            }
          );
        });
        return;

      case MessageType.MOCK_ADAPTER_CLEAR_STATE_REQUEST:
        adapter.clearState().then(() => {
          this.pluginClient.sendNotification(
            MessageType.MOCK_ADAPTER_CLEAR_STATE_RESPONSE,
            {
              adapterId: adapter.getId(),
            }
          );
        });
        return;

      case MessageType.MOCK_ADAPTER_ADD_DEVICE_REQUEST:
        adapter.addDevice(msg.data.deviceId, msg.data.deviceDescr)
          .then((device) => {
            this.pluginClient.sendNotification(
              MessageType.MOCK_ADAPTER_ADD_DEVICE_RESPONSE,
              {
                adapterId: adapter.getId(),
                deviceId: device.id,
                success: true,
              }
            );
          }).catch((err) => {
            this.pluginClient.sendNotification(
              MessageType.MOCK_ADAPTER_ADD_DEVICE_RESPONSE,
              {
                adapterId: adapter.getId(),
                success: false,
                error: err,
              }
            );
          });
        return;

      case MessageType.MOCK_ADAPTER_REMOVE_DEVICE_REQUEST:
        adapter.removeDevice(msg.data.deviceId)
          .then((device) => {
            this.pluginClient.sendNotification(
              MessageType.MOCK_ADAPTER_REMOVE_DEVICE_RESPONSE,
              {
                adapterId: adapter.getId(),
                deviceId: device.id,
                success: true,
              }
            );
          }).catch((err) => {
            this.pluginClient.sendNotification(
              MessageType.MOCK_ADAPTER_REMOVE_DEVICE_RESPONSE,
              {
                adapterId: adapter.getId(),
                success: false,
                error: err,
              }
            );
          });
        return;

      case MessageType.MOCK_ADAPTER_PAIR_DEVICE_COMMAND:
        adapter.pairDevice(msg.data.deviceId, msg.data.deviceDescr);
        return;

      case MessageType.MOCK_ADAPTER_UNPAIR_DEVICE_COMMAND:
        adapter.unpairDevice(msg.data.deviceId);
        return;

      case MessageType.DEVICE_SAVED_NOTIFICATION:
        adapter.handleDeviceSaved(msg.data.deviceId, msg.data.device);
        return;
    }

    // All messages from here on are assumed to require a valid deviceId.

    const deviceId = msg.data.deviceId;
    const device = adapter.getDevice(deviceId);
    if (!device) {
      console.error('AddonManagerProxy: No such device:', deviceId);
      console.error('AddonManagerProxy: Ignoring msg:', msg);
      return;
    }

    switch (msg.messageType) {

      case MessageType.ADAPTER_REMOVE_DEVICE_REQUEST:
        adapter.removeThing(device);
        break;

      case MessageType.ADAPTER_CANCEL_REMOVE_DEVICE_COMMAND:
        adapter.cancelRemoveThing(device);
        break;

      case MessageType.DEVICE_SET_PROPERTY_COMMAND: {
        const propertyName = msg.data.propertyName;
        const propertyValue = msg.data.propertyValue;
        const property = device.findProperty(propertyName);
        if (property) {
          property.setValue(propertyValue).then((_updatedValue) => {
            if (property.isFireAndForget()) {
              // This property doesn't send propertyChanged notifications,
              // so we fake one.
              this.sendPropertyChangedNotification(property);
            } else {
              // We should get a propertyChanged notification thru
              // the normal channels, so don't sent another one here.
              // We don't really need to do anything.
            }
          }).catch((err) => {
            // Something bad happened. The gateway is still
            // expecting a reply, so we report the error
            // and just send whatever the current value is.
            console.error('AddonManagerProxy: Failed to setProperty',
              propertyName, 'to', propertyValue,
              'for device:', deviceId);
            if (err) {
              console.error(err);
            }
            this.sendPropertyChangedNotification(property);
          });
        } else {
          console.error('AddonManagerProxy: Unknown property:',
            propertyName);
        }
        break;
      }
      case MessageType.DEVICE_REQUEST_ACTION_REQUEST: {
        const actionName = msg.data.actionName;
        const actionId = msg.data.actionId;
        const input = msg.data.input;
        device.requestAction(actionId, actionName, input)
          .then(() => {
            this.pluginClient.sendNotification(
              MessageType.DEVICE_REQUEST_ACTION_RESPONSE,
              {
                adapterId: adapter.getId(),
                deviceId: deviceId,
                actionName: actionName,
                actionId: actionId,
                success: true,
              }
            );
          }).catch((err) => {
            console.error('AddonManagerProxy: Failed to request action',
              actionName, 'for device:', deviceId);
            if (err) {
              console.error(err);
            }
            this.pluginClient.sendNotification(
              MessageType.DEVICE_REQUEST_ACTION_RESPONSE,
              {
                adapterId: adapter.getId(),
                deviceId: deviceId,
                actionName: actionName,
                actionId: actionId,
                success: false,
              }
            );
          });
        break;
      }
      case MessageType.DEVICE_REMOVE_ACTION_REQUEST: {
        const actionName = msg.data.actionName;
        const actionId = msg.data.actionId;
        const messageId = msg.data.messageId;
        device.removeAction(actionId, actionName)
          .then(() => {
            this.pluginClient.sendNotification(
              MessageType.DEVICE_REMOVE_ACTION_RESPONSE,
              {
                adapterId: adapter.getId(),
                actionName: actionName,
                actionId: actionId,
                messageId: messageId,
                deviceId: deviceId,
                success: true,
              }
            );
          }).catch((err) => {
            console.error('AddonManagerProxy: Failed to remove action',
              actionName, 'for device:', deviceId);
            if (err) {
              console.error(err);
            }
            this.pluginClient.sendNotification(
              MessageType.DEVICE_REMOVE_ACTION_RESPONSE,
              {
                adapterId: adapter.getId(),
                actionName: actionName,
                actionId: actionId,
                messageId: messageId,
                deviceId: deviceId,
                success: false,
              }
            );
          });
        break;
      }
      case MessageType.DEVICE_SET_PIN_REQUEST: {
        const pin = msg.data.pin;
        const messageId = msg.data.messageId;
        adapter.setPin(deviceId, pin)
          .then(() => {
            const dev = adapter.getDevice(deviceId);
            this.pluginClient.sendNotification(
              MessageType.DEVICE_SET_PIN_RESPONSE,
              {
                device: dev.asDict(),
                messageId: messageId,
                adapterId: adapter.getId(),
                success: true,
              }
            );
          }).catch((err) => {
            console.error(
              `AddonManagerProxy: Failed to set PIN for device ${deviceId}`);
            if (err) {
              console.error(err);
            }

            this.pluginClient.sendNotification(
              MessageType.DEVICE_SET_PIN_RESPONSE,
              {
                deviceId: deviceId,
                messageId: messageId,
                adapterId: adapter.getId(),
                success: false,
              }
            );
          });
        break;
      }
      case MessageType.DEVICE_SET_CREDENTIALS_REQUEST: {
        const username = msg.data.username;
        const password = msg.data.password;
        const messageId = msg.data.messageId;
        adapter.setCredentials(deviceId, username, password)
          .then(() => {
            const dev = adapter.getDevice(deviceId);
            this.pluginClient.sendNotification(
              MessageType.DEVICE_SET_CREDENTIALS_RESPONSE,
              {
                device: dev.asDict(),
                messageId: messageId,
                adapterId: adapter.getId(),
                success: true,
              }
            );
          }).catch((err) => {
            console.error(
              `AddonManagerProxy: Failed to set credentials for device ${deviceId}`);
            if (err) {
              console.error(err);
            }

            this.pluginClient.sendNotification(
              MessageType.DEVICE_SET_CREDENTIALS_RESPONSE,
              {
                deviceId: deviceId,
                messageId: messageId,
                adapterId: adapter.getId(),
                success: false,
              }
            );
          });
        break;
      }
      case MessageType.DEVICE_DEBUG_COMMAND:
        device.debugCmd(msg.data.cmd, msg.data.params);
        break;

      default:
        console.warn('AddonManagerProxy: unrecognized msg:', msg);
        break;
    }
  }

  /**
   * @method sendPairingPrompt
   * Send a prompt to the UI notifying the user to take some action.
   */
  sendPairingPrompt(adapter: Adapter, prompt: string, url?: string, device?: Device) {
    const data: any = {
      adapterId: adapter.getId(),
      prompt: prompt,
    };

    if (url) {
      data.url = url;
    }

    if (device) {
      data.deviceId = device.getId();
    }

    this.pluginClient.sendNotification(
      MessageType.ADAPTER_PAIRING_PROMPT_NOTIFICATION,
      data
    );
  }

  /**
   * @method sendUnpairingPrompt
   * Send a prompt to the UI notifying the user to take some action.
   */
  sendUnpairingPrompt(adapter: Adapter, prompt: string, url?: string, device?: Device) {
    const data: any = {
      adapterId: adapter.getId(),
      prompt: prompt,
    };

    if (url) {
      data.url = url;
    }

    if (device) {
      data.deviceId = device.getId();
    }

    this.pluginClient.sendNotification(
      MessageType.ADAPTER_UNPAIRING_PROMPT_NOTIFICATION,
      data
    );
  }

  /**
   * @method sendPropertyChangedNotification
   * Sends a propertyChanged notification to the gateway.
   */
  sendPropertyChangedNotification(property: Property) {
    this.pluginClient.sendNotification(
      MessageType.DEVICE_PROPERTY_CHANGED_NOTIFICATION,
      {
        adapterId: property.device.getAdapter().getId(),
        deviceId: property.device.getId(),
        property: property.asDict(),
      }
    );
  }

  /**
   * @method sendActionStatusNotification
   * Sends an actionStatus notification to the gateway.
   */
  sendActionStatusNotification(action: Action) {
    this.pluginClient.sendNotification(
      MessageType.DEVICE_ACTION_STATUS_NOTIFICATION,
      {
        adapterId: action.device.getAdapter().getId(),
        deviceId: action.device.getId(),
        action: action.asDict(),
      }
    );
  }

  /**
   * @method sendEventNotification
   * Sends an event notification to the gateway.
   */
  sendEventNotification(event: Event) {
    this.pluginClient.sendNotification(
      MessageType.DEVICE_EVENT_NOTIFICATION,
      {
        adapterId: event.getDevice().getAdapter().getId(),
        deviceId: event.getDevice().getId(),
        event: event.asDict(),
      }
    );
  }

  /**
   * @method sendConnectedNotification
   * Sends a connected notification to the gateway.
   */
  sendConnectedNotification(device: Device, connected: boolean) {
    this.pluginClient.sendNotification(
      MessageType.DEVICE_CONNECTED_STATE_NOTIFICATION,
      {
        adapterId: device.getAdapter().getId(),
        deviceId: device.getId(),
        connected,
      }
    );
  }

  /**
   * @method unloadPlugin
   *
   * Unloads the plugin, and tells the server about it.
   */
  unloadPlugin() {
    if ((<any>this.pluginClient).ipcProtocol === 'inproc') {
      if (this.onUnload) {
        this.onUnload();
      }
    } else {
      // Wait a small amount of time to allow the pluginUnloaded
      // message to be processed by the server before closing.
      setTimeout(() => {
        this.pluginClient.unload();
      }, 500);
    }
    this.pluginClient.sendNotification(MessageType.PLUGIN_UNLOAD_RESPONSE, {});
  }

  sendError(message: string) {
    this.pluginClient.sendNotification(
      MessageType.PLUGIN_ERROR_NOTIFICATION,
      {
        message,
      }
    );
  }
}
