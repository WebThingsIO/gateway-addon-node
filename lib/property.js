/**
 * Property.
 *
 * Object which decscribes a property, and its value.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

'use strict';

const assert = require('assert');

const DESCR_FIELDS = [
  'title',
  'type',
  '@type',
  'unit',
  'description',
  'minimum',
  'maximum',
  'enum',
  'readOnly',
  'multipleOf',
  'links',
];
function copyDescrFieldsInto(target, source) {
  // Check 'min' and 'max' for backwards compatibility.
  if (source.hasOwnProperty('min')) {
    target.minimum = source.min;
  }

  if (source.hasOwnProperty('max')) {
    target.maximum = source.max;
  }

  // Check 'label' for backwards compatibility.
  if (source.hasOwnProperty('label')) {
    target.title = source.label;
  }

  for (const field of DESCR_FIELDS) {
    if (source.hasOwnProperty(field)) {
      target[field] = source[field];
    }
  }
}

class Property {
  constructor(device, name, propertyDescr) {
    // The propertyDescr argument used to be the 'type' string, so we add an
    // assertion here to notify anybody who has an older plugin.

    assert.equal(typeof propertyDescr, 'object',
                 'Please update plugin to use property description.');

    this.device = device;
    this.name = name;
    this.visible = true;
    this.fireAndForget = false;
    if (propertyDescr.hasOwnProperty('visible')) {
      this.visible = propertyDescr.visible;
    }

    copyDescrFieldsInto(this, propertyDescr);
  }

  /**
   * @returns a dictionary of useful information.
   * This is primarily used for debugging.
   */
  asDict() {
    const prop = {
      name: this.name,
      value: this.value,
      visible: this.visible,
    };
    copyDescrFieldsInto(prop, this);
    return prop;
  }

  /**
   * @returns the dictionary as used to describe a property. Currently
   * this does not include the href field.
   */
  asPropertyDescription() {
    const description = {};
    copyDescrFieldsInto(description, this);
    return description;
  }

  /**
   * @method isVisible
   * @returns true if this is a visible property, which is a property
   *          that is reported in the property description.
   */
  isVisible() {
    return this.visible;
  }

  /**
   * Sets the value and notifies the device if the value has changed.
   * @returns true if the value has changed
   */
  setCachedValueAndNotify(value) {
    const oldValue = this.value;
    this.setCachedValue(value);

    // setCachedValue may change the value, therefore we have to check
    // this.value after the call to setCachedValue
    const hasChanged = oldValue !== this.value;

    if (hasChanged) {
      this.device.notifyPropertyChanged(this);

      console.log('setCachedValueAndNotify for property', this.name,
                  'from', oldValue, 'to', this.value, 'for', this.device.id);
    }

    return hasChanged;
  }

  /**
   * Sets this.value and makes adjustments to ensure that the value
   * is consistent with the type.
   */
  setCachedValue(value) {
    if (this.type === 'boolean') {
      // Make sure that the value is actually a boolean.
      this.value = !!value;
    } else {
      this.value = value;
    }
    return this.value;
  }

  /**
   * @method getValue
   * @returns a promise which resolves to the retrieved value.
   *
   * This implementation is a simple one that just returns
   * the previously cached value.
   */
  getValue() {
    return new Promise((resolve) => {
      if (this.value != this.prevGetValue) {
        console.log('getValue for property', this.name,
                    'for:', this.device.title,
                    'returning', this.value);
        this.prevGetValue = this.value;
      }
      resolve(this.value);
    });
  }

  /**
   * @method setValue
   * @returns a promise which resolves to the updated value.
   *
   * @note it is possible that the updated value doesn't match
   * the value passed in.
   *
   * It is anticipated that this method will most likely be overridden
   * by a derived class.
   */
  setValue(value) {
    return new Promise((resolve, reject) => {
      if (this.readOnly) {
        reject('Read-only property');
        return;
      }

      if (this.hasOwnProperty('minimum') && value < this.minimum) {
        reject(`Value less than minimum: ${this.minimum}`);
        return;
      }

      if (this.hasOwnProperty('maximum') && value > this.maximum) {
        reject(`Value greater than maximum: ${this.maximum}`);
        return;
      }

      if (this.hasOwnProperty('multipleOf') &&
          value / this.multipleOf - Math.round(value / this.multipleOf) !== 0) {
        // note that we don't use the modulus operator here because it's
        // unreliable for floating point numbers
        reject(`Value is not a multiple of: ${this.multipleOf}`);
        return;
      }

      if (this.hasOwnProperty('enum') && this.enum.length > 0 &&
          !this.enum.includes(value)) {
        reject('Invalid enum value');
        return;
      }

      this.setCachedValueAndNotify(value);
      resolve(this.value);
    });
  }
}

module.exports = Property;
