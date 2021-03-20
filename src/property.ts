/**
 * Property.
 *
 * Object which decscribes a property, and its value.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { Device } from './device';

import { Any, PropertyForm, Property as PropertySchema, PropertyValueType } from './schema';

import assert from 'assert';

interface LegacyPropertyDescription {
  min: number;
  max: number;
  label: string;
}

export class Property<T extends Any> {
  private device: Device;

  private name: string;

  private title?: string;

  private type: PropertyValueType;

  private '@type'?: string;

  private unit?: string;

  private description?: string;

  private minimum?: number;

  private maximum?: number;

  private enum?: Any[];

  private readOnly?: boolean;

  private multipleOf?: number;

  private forms: PropertyForm[];

  private fireAndForget = false;

  private value?: T;

  private prevGetValue?: T;

  constructor(device: Device, name: string, propertyDescr: PropertySchema) {
    this.device = device;

    this.name = name;

    // The propertyDescr argument used to be the 'type' string, so we add an
    // assertion here to notify anybody who has an older plugin.
    assert.equal(
      typeof propertyDescr,
      'object',
      'Please update plugin to use property description.'
    );

    const legacyDescription = <LegacyPropertyDescription>(<unknown>propertyDescr);

    this.title = propertyDescr.title || legacyDescription.label;
    this.type = propertyDescr.type;
    this['@type'] = propertyDescr['@type'];
    this.unit = propertyDescr.unit;
    this.description = propertyDescr.description;
    this.minimum = propertyDescr.minimum ?? legacyDescription.min;
    this.maximum = propertyDescr.maximum ?? legacyDescription.max;
    this.enum = propertyDescr.enum;
    this.readOnly = propertyDescr.readOnly;
    this.multipleOf = propertyDescr.multipleOf;
    this.forms = propertyDescr.forms ?? [];
  }

  /**
   * @returns a dictionary of useful information.
   * This is primarily used for debugging.
   */
  asDict(): PropertySchema {
    return {
      name: this.name,
      value: this.value,
      title: this.title,
      type: this.type,
      '@type': this['@type'],
      unit: this.unit,
      description: this.description,
      minimum: this.minimum,
      maximum: this.maximum,
      enum: this.enum,
      readOnly: this.readOnly,
      multipleOf: this.multipleOf,
      forms: this.forms,
    };
  }

  /**
   * @returns the dictionary as used to describe a property. Currently
   * this does not include the href field.
   */
  asPropertyDescription(): PropertySchema {
    return {
      title: this.title,
      type: this.type,
      '@type': this['@type'],
      unit: this.unit,
      description: this.description,
      minimum: this.minimum,
      maximum: this.maximum,
      enum: this.enum,
      readOnly: this.readOnly,
      multipleOf: this.multipleOf,
      forms: this.forms,
    };
  }

  isFireAndForget(): boolean {
    return this.fireAndForget;
  }

  /**
   * Sets the value and notifies the device if the value has changed.
   * @returns true if the value has changed
   */
  setCachedValueAndNotify(value: T): boolean {
    const oldValue = this.value;
    this.setCachedValue(value);

    // setCachedValue may change the value, therefore we have to check
    // this.value after the call to setCachedValue
    const hasChanged = oldValue !== this.value;

    if (hasChanged) {
      this.device.notifyPropertyChanged(this);
    }

    return hasChanged;
  }

  getCachedValue(): T | undefined {
    return this.value;
  }

  /**
   * Sets this.value and makes adjustments to ensure that the value
   * is consistent with the type.
   */
  setCachedValue(value: T): T {
    if (this.type === 'boolean') {
      // Make sure that the value is actually a boolean.
      this.value = <T>(<unknown>!!value);
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
  getValue(): Promise<T> {
    return new Promise((resolve) => {
      if (this.value != this.prevGetValue) {
        this.prevGetValue = this.value;
      }
      resolve(<T>this.value);
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
  setValue(value: T): Promise<T> {
    return new Promise((resolve, reject) => {
      if (this.readOnly) {
        reject('Read-only property');
        return;
      }

      const numberValue = <number>(<unknown>value);

      if (typeof this.minimum !== 'undefined' && numberValue < this.minimum) {
        reject(`Value less than minimum: ${this.minimum}`);
        return;
      }

      if (typeof this.maximum !== 'undefined' && numberValue > this.maximum) {
        reject(`Value greater than maximum: ${this.maximum}`);
        return;
      }

      if (
        typeof this.multipleOf !== 'undefined' &&
        numberValue / this.multipleOf - Math.round(numberValue / this.multipleOf) !== 0
      ) {
        // note that we don't use the modulus operator here because it's
        // unreliable for floating point numbers
        reject(`Value is not a multiple of: ${this.multipleOf}`);
        return;
      }

      if (this.enum && this.enum.length > 0 && !this.enum.includes(`${value}`)) {
        reject('Invalid enum value');
        return;
      }

      this.setCachedValueAndNotify(value);
      resolve(<T>this.value);
    });
  }

  getDevice(): Device {
    return this.device;
  }

  getName(): string {
    return this.name;
  }

  setName(value: string): void {
    this.name = value;
  }

  getTitle(): string | undefined {
    return this.title;
  }

  setTitle(value: string): void {
    this.title = value;
  }

  getType(): string | undefined {
    return this.type;
  }

  setType(value: PropertyValueType): void {
    this.type = value;
  }

  getAtType(): string | undefined {
    return this['@type'];
  }

  setAtType(value: string): void {
    this['@type'] = value;
  }

  getUnit(): string | undefined {
    return this.unit;
  }

  setUnit(value: string): void {
    this.unit = value;
  }

  getDescription(): string | undefined {
    return this.description;
  }

  setDescription(value: string): void {
    this.description = value;
  }

  getMinimum(): number | undefined {
    return this.minimum;
  }

  setMinimum(value: number): void {
    this.minimum = value;
  }

  getMaximum(): number | undefined {
    return this.maximum;
  }

  setMaximum(value: number): void {
    this.maximum = value;
  }

  getEnum(): Any[] | undefined {
    return this.enum;
  }

  setEnum(value: Any[]): void {
    this.enum = value;
  }

  getReadOnly(): boolean | undefined {
    return this.readOnly;
  }

  setReadOnly(value: boolean): void {
    this.readOnly = value;
  }

  getMultipleOf(): number | undefined {
    return this.multipleOf;
  }

  setMultipleOf(value: number): void {
    this.multipleOf = value;
  }

  getForms(): PropertyForm[] {
    return this.forms;
  }

  setForms(value: PropertyForm[]): void {
    this.forms = value;
  }
}
