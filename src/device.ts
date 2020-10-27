/**
 * Device Model.
 *
 * Abstract base class for devices managed by an adapter.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

'use strict';

import { Action, ActionDescription } from './action';
import Ajv from 'ajv';
import { Adapter } from './adapter';
import { Property, PropertyDescription } from './property';
import { Event, EventDescription } from './event';
const ajv = new Ajv();

export interface DeviceDescription {
  id: string,
  title: string,
  '@context': string,
  '@type': string[],
  description: string,
  properties: Record<string, PropertyDescription>,
  actions: Record<string, ActionDescription>,
  events: Record<string, EventDescription>,
  links: Link[],
  baseHref?: string,
  pin: {
    required: boolean,
    pattern?: string,
  },
  credentialsRequired: boolean,
}

export interface Link {
  rel: string,
  href: string
}

export class Device {
  private '@context' = 'https://webthings.io/schemas';
  private '@type': string[] = [];
  private name: string = '';
  private title = '';
  private description = '';
  private properties = new Map<string, Property>();
  private actions = new Map<string, ActionDescription>();
  private events = new Map<string, EventDescription>();
  private links: Link[] = [];
  private baseHref?: string;
  private pinRequired = false;
  private pinPattern?: string;
  private credentialsRequired = false;

  constructor(private adapter: Adapter, private id: string) {
    if (typeof id !== 'string') {
      id = (<any>id).toString();
    }
  }

  mapToDict<V>(map: Map<string, V>) {
    const dict: Record<string, V> = {};
    map.forEach((property, propertyName) => {
      dict[propertyName] = property;
    });
    return dict;
  }

  mapToDictF<V>(map: Map<string, { asDict: () => V }>) {
    const dict: Record<string, V> = {};
    map.forEach((property, propertyName) => {
      dict[propertyName] = property.asDict();
    });
    return dict;
  }

  asDict(): DeviceDescription {
    return {
      id: this.id,
      title: this.title || this.name,
      '@context': this['@context'],
      '@type': this['@type'],
      description: this.description,
      properties: this.mapToDictF(this.properties),
      actions: this.mapToDict(this.actions),
      events: this.mapToDict(this.events),
      links: this.links,
      baseHref: this.baseHref,
      pin: {
        required: this.pinRequired,
        pattern: this.pinPattern,
      },
      credentialsRequired: this.credentialsRequired,
    };
  }

  /**
   * @returns this object as a thing
   */
  asThing(): DeviceDescription {
    return {
      id: this.id,
      title: this.title || this.name,
      '@context': this['@context'],
      '@type': this['@type'],
      description: this.description,
      properties: this.mapToDictF(this.properties),
      actions: this.mapToDict(this.actions),
      events: this.mapToDict(this.events),
      links: this.links,
      baseHref: this.baseHref,
      pin: {
        required: this.pinRequired,
        pattern: this.pinPattern,
      },
      credentialsRequired: this.credentialsRequired,
    };
  }

  debugCmd(cmd: string, params: any) {
    console.log('Device:', this.name, 'got debugCmd:', cmd, 'params:', params);
  }

  getId() {
    return this.id;
  }

  getName() {
    console.log('getName() is deprecated. Please use getTitle().');
    return this.getTitle();
  }

  getTitle() {
    if (this.name && !this.title) {
      this.title = this.name;
    }

    return this.title;
  }

  getPropertyDescriptions() {
    const propDescs: Record<string, PropertyDescription> = {};
    this.properties.forEach((property, propertyName) => {
      if (property.isVisible()) {
        propDescs[propertyName] = property.asPropertyDescription();
      }
    });
    return propDescs;
  }

  findProperty(propertyName: string) {
    return this.properties.get(propertyName);
  }

  /**
   * @method getProperty
   * @returns a promise which resolves to the retrieved value.
   */
  getProperty(propertyName: string) {
    return new Promise((resolve, reject) => {
      const property = this.findProperty(propertyName);
      if (property) {
        property.getValue().then((value) => {
          resolve(value);
        });
      } else {
        reject(`Property "${propertyName}" not found`);
      }
    });
  }

  hasProperty(propertyName: string) {
    return this.properties.has(propertyName);
  }

  notifyPropertyChanged(property: Property) {
    this.adapter.getManager().sendPropertyChangedNotification(property);
  }

  actionNotify(action: Action) {
    this.adapter.getManager().sendActionStatusNotification(action);
  }

  eventNotify(event: Event) {
    this.adapter.getManager().sendEventNotification(event);
  }

  connectedNotify(connected: boolean) {
    this.adapter.getManager().sendConnectedNotification(this, connected);
  }

  setDescription(description: string) {
    this.description = description;
  }

  setName(name: string) {
    console.log('setName() is deprecated. Please use setTitle().');
    this.setTitle(name);
  }

  setTitle(title: string) {
    this.title = title;
  }

  /**
   * @method setProperty
   * @returns a promise which resolves to the updated value.
   *
   * @note it is possible that the updated value doesn't match
   * the value passed in.
   */
  setProperty(propertyName: string, value: any) {
    const property = this.findProperty(propertyName);
    if (property) {
      return property.setValue(value);
    }

    return Promise.reject(`Property "${propertyName}" not found`);
  }

  getAdapter() {
    return this.adapter;
  }

  /**
   * @method requestAction
   * @returns a promise which resolves when the action has been requested.
   */
  requestAction(actionId: string, actionName: string, input: any) {
    return new Promise((resolve, reject) => {
      if (!this.actions.has(actionName)) {
        reject(`Action "${actionName}" not found`);
        return;
      }

      // Validate action input, if present.
      const metadata = this.actions.get(actionName);
      if (metadata) {
        if (metadata.hasOwnProperty('input')) {
          const valid = ajv.validate(metadata.input, input);
          if (!valid) {
            reject(`Action "${actionName}": input "${input}" is invalid`);
          }
        }
      } else {
        reject(`Action "${actionName}" not found`);
      }

      const action = new Action(actionId, this, actionName, input);
      this.performAction(action).catch((err) => console.log(err));
      resolve();
    });
  }

  /**
   * @method removeAction
   * @returns a promise which resolves when the action has been removed.
   */
  removeAction(actionId: string, actionName: string) {
    return new Promise((resolve, reject) => {
      if (!this.actions.has(actionName)) {
        reject(`Action "${actionName}" not found`);
        return;
      }

      this.cancelAction(actionId, actionName).catch((err) => console.log(err));
      resolve();
    });
  }

  /**
   * @method performAction
   */
  performAction(_action: any) {
    return Promise.resolve();
  }

  /**
   * @method cancelAction
   */
  cancelAction(_actionId: string, _actionName: string) {
    return Promise.resolve();
  }

  /**
   * Add an action.
   *
   * @param {String} name Name of the action
   * @param {Object} metadata Action metadata, i.e. type, description, etc., as
   *                          an object
   */
  addAction(name: string, metadata: any) {
    metadata = metadata || {};
    if (metadata.hasOwnProperty('href')) {
      delete metadata.href;
    }

    this.actions.set(name, metadata);
  }

  /**
   * Add an event.
   *
   * @param {String} name Name of the event
   * @param {Object} metadata Event metadata, i.e. type, description, etc., as
   *                          an object
   */
  addEvent(name: string, metadata: any) {
    metadata = metadata || {};
    if (metadata.hasOwnProperty('href')) {
      delete metadata.href;
    }

    this.events.set(name, metadata);
  }
}
