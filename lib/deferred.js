/**
 * Wraps up a promise in a slightly more convenient manner for passing
 * around, or saving.
 *
 * @module Deferred
 */

'use strict';

let id = 0;

class Deferred {
  constructor() {
    this.id = ++id;
    this.promise = new Promise((resolve, reject) => {
      this.resolveFunc = resolve;
      this.rejectFunc = reject;
    });
  }

  resolve(arg) {
    return this.resolveFunc(arg);
  }

  reject(arg) {
    return this.rejectFunc(arg);
  }
}

module.exports = Deferred;
