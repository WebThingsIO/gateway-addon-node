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

const Action = require('./action');
const Constants = require('./constants');
const Ajv = require('ajv');
const ajv = new Ajv();

class Device {
  constructor(adapter, id) {
    if (typeof id !== 'string') {
      id = id.toString();
    }

    this.adapter = adapter;
    this.id = id;
    this.type = 'thing';
    this.name = '';
    this.description = '';
    this.properties = new Map();
    this.actions = new Map();
    this.events = new Map();
  }

  asDict() {
    const properties = {};
    this.properties.forEach((property, propertyName) => {
      properties[propertyName] = property.asDict();
    });

    const actions = {};
    this.actions.forEach((metadata, actionName) => {
      actions[actionName] = Object.assign({}, metadata);
    });

    const events = {};
    this.events.forEach((metadata, eventName) => {
      events[eventName] = Object.assign({}, metadata);
    });

    return {
      id: this.id,
      name: this.name,
      type: this.type,
      description: this.description,
      properties: properties,
      actions: actions,
      events: events,
    };
  }

  /**
   * @returns this object as a thing
   */
  asThing() {
    const thing = {
      id: this.id,
      name: this.name,
      type: this.type,
      properties: this.getPropertyDescriptions(),
    };

    if (this.description) {
      thing.description = this.description;
    }

    if (this.actions) {
      thing.actions = {};
      this.actions.forEach((metadata, actionName) => {
        thing.actions[actionName] = Object.assign({}, metadata);
      });
    }

    if (this.events) {
      thing.events = {};
      this.events.forEach((metadata, eventName) => {
        thing.events[eventName] = Object.assign({}, metadata);
      });
    }

    return thing;
  }

  debugCmd(cmd, params) {
    console.log('Device:', this.name, 'got debugCmd:', cmd, 'params:', params);
  }

  getId() {
    return this.id;
  }

  getName() {
    return this.name;
  }

  getType() {
    return this.type;
  }

  getPropertyDescriptions() {
    const propDescs = {};
    this.properties.forEach((property, propertyName) => {
      if (property.isVisible()) {
        propDescs[propertyName] = property.asPropertyDescription();
      }
    });
    return propDescs;
  }

  findProperty(propertyName) {
    return this.properties.get(propertyName);
  }

  /**
   * @method getProperty
   * @returns a promise which resolves to the retrieved value.
   */
  getProperty(propertyName) {
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

  hasProperty(propertyName) {
    return this.properties.has(propertyName);
  }

  notifyPropertyChanged(property) {
    this.adapter.manager.emit(Constants.PROPERTY_CHANGED, property);
  }

  actionNotify(action) {
    this.adapter.manager.emit(Constants.ACTION_STATUS, action);
  }

  eventNotify(event) {
    this.adapter.manager.emit(Constants.EVENT, event);
  }

  setDescription(description) {
    this.description = description;
  }

  setName(name) {
    this.name = name;
  }

  /**
   * @method setProperty
   * @returns a promise which resolves to the updated value.
   *
   * @note it is possible that the updated value doesn't match
   * the value passed in.
   */
  setProperty(propertyName, value) {
    return new Promise((resolve, reject) => {
      const property = this.findProperty(propertyName);
      if (property) {
        property.setValue(value).then((updatedValue) => {
          resolve(updatedValue);
        });
      } else {
        reject(`Property "${propertyName}" not found`);
      }
    });
  }

  /**
   * @method requestAction
   * @returns a promise which resolves when the action has been requested.
   */
  requestAction(actionId, actionName, input) {
    return new Promise((resolve, reject) => {
      if (!this.actions.has(actionName)) {
        reject(`Action "${actionName}" not found`);
        return;
      }

      // Validate action input, if present.
      const metadata = this.actions.get(actionName);
      if (metadata.hasOwnProperty('input')) {
        const valid = ajv.validate(metadata.input, input);
        if (!valid) {
          reject(`Action "${actionName}": input "${input}" is invalid`);
        }
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
  removeAction(actionId, actionName) {
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
  performAction(_action) {
    return Promise.resolve();
  }

  /**
   * @method cancelAction
   */
  cancelAction(_actionId, _actionName) {
    return Promise.resolve();
  }

  /**
   * Add an action.
   *
   * @param {String} name Name of the action
   * @param {Object} metadata Action metadata, i.e. type, description, etc., as
   *                          an object
   */
  addAction(name, metadata) {
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
  addEvent(name, metadata) {
    metadata = metadata || {};
    if (metadata.hasOwnProperty('href')) {
      delete metadata.href;
    }

    this.events.set(name, metadata);
  }
}

module.exports = Device;
