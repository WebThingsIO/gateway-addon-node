/**
 * Device Model.
 *
 * Abstract base class for devices managed by an adapter.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import {Action, ActionDescription} from './action';
import Ajv from 'ajv';
import {Adapter} from './adapter';
import {Property, PropertyDescription} from './property';
import {Event, EventDescription} from './event';
const ajv = new Ajv();

export interface DeviceDescription {
  id: string;
  title: string;
  '@context': string;
  '@type': string[];
  description: string;
  properties: Record<string, PropertyDescription>;
  actions: Record<string, ActionDescription>;
  events: Record<string, EventDescription>;
  links: Link[];
  baseHref?: string;
  pin: {
    required: boolean;
    pattern?: string;
  };
  credentialsRequired: boolean;
}

export interface Link {
  rel: string;
  href: string;
}

export class Device {
  private adapter: Adapter;

  private id: string;

  private '@context' = 'https://webthings.io/schemas';

  private '@type': string[] = [];

  private name = '';

  private title = '';

  private description = '';

  private properties = new Map<string, Property<unknown>>();

  private actions = new Map<string, ActionDescription>();

  private events = new Map<string, EventDescription>();

  private links: Link[] = [];

  private baseHref?: string;

  private pinRequired = false;

  private pinPattern?: string;

  private credentialsRequired = false;

  constructor(adapter: Adapter, id: string) {
    this.adapter = adapter;
    this.id = `${id}`;
  }

  mapToDict<V>(map: Map<string, V>): Record<string, V> {
    const dict: Record<string, V> = {};
    map.forEach((property, propertyName) => {
      dict[propertyName] = property;
    });
    return dict;
  }

  mapToDictFromFunction<V>(map: Map<string, { asDict: () => V }>)
  : Record<string, V> {
    const dict: Record<string, V> = {};
    map.forEach((property, propertyName) => {
      dict[propertyName] = property.asDict();
    });
    return dict;
  }

  asDict(): DeviceDescription {
    return {
      id: this.id,
      title: this.title ?? this.name,
      '@context': this['@context'],
      '@type': this['@type'],
      description: this.description,
      properties: this.mapToDictFromFunction(this.properties),
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
      title: this.title ?? this.name,
      '@context': this['@context'],
      '@type': this['@type'],
      description: this.description,
      properties: this.mapToDictFromFunction(this.properties),
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

  debugCmd(cmd: string, params: Record<string, unknown>): void {
    console.log('Device:', this.name, 'got debugCmd:', cmd, 'params:', params);
  }

  getId(): string {
    return this.id;
  }

  getName(): string {
    console.log('getName() is deprecated. Please use getTitle().');
    return this.getTitle();
  }

  getTitle(): string {
    if (this.name && !this.title) {
      this.title = this.name;
    }

    return this.title;
  }

  getPropertyDescriptions(): Record<string, unknown> {
    const propDescs: Record<string, PropertyDescription> = {};
    this.properties.forEach((property, propertyName) => {
      if (property.isVisible()) {
        propDescs[propertyName] = property.asPropertyDescription();
      }
    });
    return propDescs;
  }

  findProperty(propertyName: string): Property<unknown> | undefined {
    return this.properties.get(propertyName);
  }

  /**
   * @method getProperty
   * @returns a promise which resolves to the retrieved value.
   */
  getProperty(propertyName: string): Promise<unknown> {
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

  hasProperty(propertyName: string): boolean {
    return this.properties.has(propertyName);
  }

  notifyPropertyChanged(property: Property<unknown>): void {
    this.adapter.getManager().sendPropertyChangedNotification(property);
  }

  actionNotify(action: Action): void {
    this.adapter.getManager().sendActionStatusNotification(action);
  }

  eventNotify(event: Event): void {
    this.adapter.getManager().sendEventNotification(event);
  }

  connectedNotify(connected: boolean): void {
    this.adapter.getManager().sendConnectedNotification(this, connected);
  }

  setDescription(description: string): void {
    this.description = description;
  }

  setName(name: string): void {
    console.log('setName() is deprecated. Please use setTitle().');
    this.setTitle(name);
  }

  setTitle(title: string): void {
    this.title = title;
  }

  /**
   * @method setProperty
   * @returns a promise which resolves to the updated value.
   *
   * @note it is possible that the updated value doesn't match
   * the value passed in.
   */
  setProperty(propertyName: string, value: unknown): Promise<unknown> {
    const property = this.findProperty(propertyName);
    if (property) {
      return property.setValue(value);
    }

    return Promise.reject(`Property "${propertyName}" not found`);
  }

  getAdapter(): Adapter {
    return this.adapter;
  }

  /**
   * @method requestAction
   * @returns a promise which resolves when the action has been requested.
   */
  requestAction(actionId: string, actionName: string, input: unknown)
  : Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.actions.has(actionName)) {
        reject(`Action "${actionName}" not found`);
        return;
      }

      // Validate action input, if present.
      const metadata = this.actions.get(actionName);
      if (metadata) {
        if (metadata.hasOwnProperty('input')) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const valid = ajv.validate(<any>metadata.input, input);
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
  removeAction(actionId: string, actionName: string): Promise<void> {
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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  performAction(_action: Action): Promise<void> {
    return Promise.resolve();
  }

  /**
   * @method cancelAction
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  cancelAction(_actionId: string, _actionName: string): Promise<void> {
    return Promise.resolve();
  }

  /**
   * Add an action.
   *
   * @param {String} name Name of the action
   * @param {Object} metadata Action metadata, i.e. type, description, etc., as
   *                          an object
   */
  addAction(name: string, metadata: ActionDescription): void {
    metadata = metadata ?? {};
    if (metadata.hasOwnProperty('href')) {
      const metadataWithHref = <{href?: string}><unknown>metadata;
      delete metadataWithHref.href;
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
  addEvent(name: string, metadata: EventDescription): void {
    metadata = metadata ?? {};
    if (metadata.hasOwnProperty('href')) {
      const metadataWithHref = <{href?: string}><unknown>metadata;
      delete metadataWithHref.href;
    }

    this.events.set(name, metadata);
  }
}
