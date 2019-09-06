/**
 * Wrapper around the gateway's database.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const DB_PATHS = [
  path.join(os.homedir(), 'mozilla-iot', 'gateway', 'db.sqlite3'),
  path.join(os.homedir(), '.mozilla-iot', 'config', 'db.sqlite3'),
  path.join('.', 'db.sqlite3'),               // if cwd is the gateway dir
  path.join('..', '..', '..', 'db.sqlite3'),  // if cwd is the add-on dir
];

if (process.env.hasOwnProperty('MOZIOT_HOME')) {
  DB_PATHS.unshift(path.join(process.env.MOZIOT_HOME, 'config', 'db.sqlite3'));
}

if (process.env.hasOwnProperty('MOZIOT_DATABASE')) {
  DB_PATHS.unshift(process.env.MOZIOT_DATABASE);
}

/**
 * An Action represents an individual action on a device.
 */
class Database {
  /**
   * Initialize the object.
   *
   * @param {String} packageName The adapter's package name
   * @param {String?} path Optional database path
   */
  constructor(packageName, path = null) {
    this.packageName = packageName;
    this.path = path;
    this.conn = null;

    if (!this.path) {
      for (const p of DB_PATHS) {
        if (fs.existsSync(p)) {
          this.path = p;
          break;
        }
      }
    }
  }

  /**
   * Open the database.
   *
   * @returns Promise which resolves when the database has been opened.
   */
  open() {
    if (this.conn) {
      return Promise.resolve();
    }

    if (!this.path) {
      return Promise.reject(new Error('Database path unknown'));
    }

    return new Promise((resolve, reject) => {
      this.conn = new sqlite3.Database(
        this.path,
        (err) => {
          if (err) {
            reject(err);
          } else {
            this.conn.configure('busyTimeout', 10000);
            resolve();
          }
        });
    });
  }

  /**
   * Close the database.
   */
  close() {
    if (this.conn) {
      this.conn.close();
      this.conn = null;
    }
  }

  /**
   * Load the package's config from the database.
   *
   * @returns Promise which resolves to the config object.
   */
  loadConfig() {
    if (!this.conn) {
      return Promise.reject('Database not open');
    }

    const key = `addons.config.${this.packageName}`;

    return new Promise((resolve, reject) => {
      this.conn.get(
        'SELECT value FROM settings WHERE key = ?',
        [key],
        (error, row) => {
          if (error) {
            reject(error);
          } else if (!row) {
            resolve({});
          } else {
            resolve(JSON.parse(row.value));
          }
        });
    });
  }

  /**
   * Save the package's config to the database.
   */
  saveConfig(config) {
    if (!this.conn) {
      return;
    }

    const key = `addons.config.${this.packageName}`;

    return new Promise((resolve, reject) => {
      this.conn.run(
        'INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)',
        [key, JSON.stringify(config)],
        (error) => {
          if (error) {
            reject(error);
          } else {
            resolve();
          }
        });
    });
  }
}

module.exports = Database;
