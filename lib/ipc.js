'use strict';

const Ajv = require('ajv');
const fs = require('fs');
const path = require('path');
const WebSocket = require('ws');

const DEBUG_MSG = false;

class IpcSocket {
  constructor(isServer, port, onMsg, logPrefix) {
    this.isServer = isServer;
    this.port = port;
    this.onMsg = onMsg;
    this.logPrefix = logPrefix;

    // Build the JSON-Schema validator for incoming messages
    const baseDir = path.resolve(path.join(__dirname, '..', 'schema'));
    const schemas = [];

    // top-level schema
    schemas.push(
      JSON.parse(fs.readFileSync(path.join(baseDir, 'schema.json')))
    );

    // individual message schemas
    for (const fname of fs.readdirSync(path.join(baseDir, 'messages'))) {
      schemas.push(
        JSON.parse(fs.readFileSync(path.join(baseDir, 'messages', fname)))
      );
    }

    // now, build the validator using all the schemas
    this.validate = new Ajv({schemas}).getSchema(schemas[0].$id);

    if (this.isServer) {
      this.wss = new WebSocket.Server({host: '127.0.0.1', port: this.port});
      this.wss.on('connection', (ws) => {
        ws.on('message', (data) => {
          this.onData(data, ws);
        });
      });
    } else {
      this.ws = new WebSocket(`ws://127.0.0.1:${this.port}/`);
      this.connectPromise = new Promise((resolve) => {
        this.ws.on('open', () => resolve(this.ws));
      });
      this.ws.on('message', this.onData.bind(this));
    }
  }

  error() {
    Array.prototype.unshift.call(arguments, this.logPrefix);
    console.error.apply(null, arguments);
  }

  log() {
    Array.prototype.unshift.call(arguments, this.logPrefix);
    console.log.apply(null, arguments);
  }

  close() {
    if (this.isServer) {
      this.wss.close();
    } else {
      this.ws.close();
    }
  }

  /**
   * @method onData
   * @param {Buffer} buf
   *
   * Called anytime a new message has been received.
   */
  onData(buf, ws) {
    const bufStr = buf.toString();
    let data;
    try {
      data = JSON.parse(bufStr);
    } catch (err) {
      this.error('Error parsing message as JSON');
      this.error(`Rcvd: "${bufStr}"`);
      this.error(err);
      return;
    }
    DEBUG_MSG && this.log('Rcvd:', data);

    // validate the message before forwarding to handler
    if (!this.validate({message: data})) {
      console.error('Invalid message received:', data);
    }

    this.onMsg(data, ws);
  }
}

module.exports = IpcSocket;
