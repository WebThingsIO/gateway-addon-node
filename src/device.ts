/**
 * Device Model.
 *
 * Abstract base class for devices managed by an adapter.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { Action } from './action';
import Ajv from 'ajv';
import { Adapter } from './adapter';
import { Property } from './property';
import { Event } from './event';
import {
  Action as ActionSchema,
  Any,
  Event as EventSchema,
  Device as DeviceSchema,
  Property as PropertySchema,
  Link,
} from './schema';

const ajv = new Ajv();

export class Device {
  private adapter: Adapter;

  private id: string;

  private '@context' = 'https://webthings.io/schemas';

  private '@type': string[] = [];

  private name = '';

  private title = '';

  private description = '';

  private properties = new Map<string, Property<Any>>();

  private actions = new Map<string, ActionSchema>();

  private events = new Map<string, EventSchema>();

  private links: Link[] = [];

  private baseHref?: string;

  private pinRequired = false;

  private pinPattern?: string;

  private credentialsRequired = false;

  constructor(adapter: Adapter, id: string) {
    this.adapter = adapter;
    this.id = `${id}`;
  }

  getId(): string {
    return this.id;
  }

  getContext(): string {
    return this['@context'];
  }

  setContext(context: string): void {
    this['@context'] = context;
  }

  getTypes(): string[] {
    return this['@type'];
  }

  setTypes(type: string[]): void {
    this['@type'] = type;
  }

  addType(type: string): void {
    if (!(type in this['@type'])) {
      this['@type'].push(type);
    }
  }

  getTitle(): string {
    if (this.name && !this.title) {
      this.title = this.name;
    }

    return this.title;
  }

  setTitle(title: string): void {
    this.title = title;
  }

  getDescription(): string {
    return this.description;
  }

  setDescription(description: string): void {
    this.description = description;
  }

  getLinks(): Link[] {
    return this.links;
  }

  setLinks(value: Link[]): void {
    this.links = value;
  }

  addLink(link: Link): void {
    this.links.push(link);
  }

  getBaseHref(): string | undefined {
    return this.baseHref;
  }

  setBaseHref(baseHref: string): void {
    this.baseHref = baseHref;
  }

  getPinRequired(): boolean {
    return this.pinRequired;
  }

  setPinRequired(pinRequired: boolean): void {
    this.pinRequired = pinRequired;
  }

  getPinPattern(): string | undefined {
    return this.pinPattern;
  }

  setPinPattern(pinPattern: string): void {
    this.pinPattern = pinPattern;
  }

  getCredentialsRequired(): boolean {
    return this.credentialsRequired;
  }

  setCredentialsRequired(credentialsRequired: boolean): void {
    this.credentialsRequired = credentialsRequired;
  }

  mapToDict<V>(map: Map<string, V>): Record<string, V> {
    const dict: Record<string, V> = {};
    map.forEach((property, propertyName) => {
      dict[propertyName] = Object.assign({}, property);
    });
    return dict;
  }

  mapToDictFromFunction<V>(map: Map<string, { asDict: () => V }>): Record<string, V> {
    const dict: Record<string, V> = {};
    map.forEach((property, propertyName) => {
      dict[propertyName] = property.asDict();
    });
    return dict;
  }

  asDict(): DeviceSchema {
    return {
      id: this.id,
      title: this.title || this.name,
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
  asThing(): DeviceSchema {
    return {
      id: this.id,
      title: this.title || this.name,
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

  getPropertyDescriptions(): Record<string, unknown> {
    const propDescs: Record<string, PropertySchema> = {};
    this.properties.forEach((property, propertyName) => {
      propDescs[propertyName] = property.asPropertyDescription();
    });
    return propDescs;
  }

  findProperty(propertyName: string): Property<Any> | undefined {
    return this.properties.get(propertyName);
  }

  addProperty(property: Property<Any>): void {
    this.properties.set(property.getName(), property);
  }

  /**
   * @method getProperty
   * @returns a promise which resolves to the retrieved value.
   */
  getProperty(propertyName: string): Promise<Any> {
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

  notifyPropertyChanged(property: Property<Any>): void {
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

  /**
   * @method setProperty
   * @returns a promise which resolves to the updated value.
   *
   * @note it is possible that the updated value doesn't match
   * the value passed in.
   */
  setProperty(propertyName: string, value: Any): Promise<Any> {
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
  requestAction(actionId: string, actionName: string, input: Any): Promise<void> {
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
  performAction(_action: Action): Promise<void> {
    return Promise.resolve();
  }

  /**
   * @method cancelAction
   */
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
  addAction(name: string, metadata?: ActionSchema): void {
    metadata = metadata ?? {};
    if (metadata.hasOwnProperty('href')) {
      const metadataWithHref = <{ href?: string }>(<unknown>metadata);
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
  addEvent(name: string, metadata?: EventSchema): void {
    metadata = metadata ?? {};
    if (metadata.hasOwnProperty('href')) {
      const metadataWithHref = <{ href?: string }>(<unknown>metadata);
      delete metadataWithHref.href;
    }

    this.events.set(name, metadata);
  }
}
