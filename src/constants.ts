/*
 * WebThings Gateway Constants.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { MessageType } from './message-type';

export { MessageType };

export enum NotificationLevel {
  LOW = 0,
  NORMAL = 1,
  HIGH = 2,
}

export const DONT_RESTART_EXIT_CODE = 100;
