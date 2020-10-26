/**
 * Wraps up a promise in a slightly more convenient manner for passing
 * around, or saving.
 *
 * @module Deferred
 */

'use strict';

let id = 0;

export class Deferred<T, E> {
  private id = ++id;
  private promise: Promise<T>;
  private resolveFunc?: ((value: T) => void);
  private rejectFunc?: ((reason: E) => void);

  constructor() {
    this.promise = new Promise((resolve, reject) => {
      this.resolveFunc = resolve;
      this.rejectFunc = reject;
    });
  }

  resolve(arg: T) {
    if (this.resolveFunc) {
      return this.resolveFunc(arg);
    }
  }

  reject(arg: E) {
    if (this.rejectFunc) {
      return this.rejectFunc(arg);
    }
  }

  getId() {
    return this.id;
  }

  getPromise() {
    return this.promise;
  }
}
