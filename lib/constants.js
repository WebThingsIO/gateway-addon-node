/*
 * WebThings Gateway Constants.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

'use strict';

const fs = require('fs');
const path = require('path');

exports.MessageType = {};

// Build up message types dynamically from schemas
const dname = path.resolve(path.join(__dirname, '..', 'schema', 'messages'));
for (const fname of fs.readdirSync(dname)) {
  const schema = JSON.parse(fs.readFileSync(path.join(dname, fname)));

  if (!schema.hasOwnProperty('properties') ||
      !schema.properties.hasOwnProperty('messageType')) {
    continue;
  }

  const name = fname.split('.')[0].toUpperCase().replace(/-/g, '_');
  const value = schema.properties.messageType.const;

  exports.MessageType[name] = value;
}

exports.NotificationLevel = {
  LOW: 0,
  NORMAL: 1,
  HIGH: 2,
};

exports.DONT_RESTART_EXIT_CODE = 100;
