'use strict';

import Ajv from 'ajv';
import fs from 'fs';
import path from 'path';
import WebSocket from 'ws';

export class IpcSocket {
  private verbose: boolean;
  private validate: any;
  private wss?: WebSocket.Server;
  private ws?: WebSocket;
  private connectPromise?: Promise<WebSocket>;

  constructor(private isServer: boolean, private port: number, private onMsg: (data: any, ws: WebSocket) => void, private logPrefix: string, { verbose }: any = {}) {
    this.onMsg = onMsg;
    this.verbose = !!verbose;

    // Build the JSON-Schema validator for incoming messages
    const baseDir = path.resolve(path.join(__dirname, '..', 'schema'));
    const schemas = [];

    // top-level schema
    schemas.push(
      JSON.parse(fs.readFileSync(path.join(baseDir, 'schema.json')).toString())
    );

    // individual message schemas
    for (const fname of fs.readdirSync(path.join(baseDir, 'messages'))) {
      schemas.push(
        JSON.parse(fs.readFileSync(path.join(baseDir, 'messages', fname)).toString())
      );
    }

    // now, build the validator using all the schemas
    this.validate = new Ajv({ schemas }).getSchema(schemas[0].$id);

    if (this.isServer) {
      this.wss = new WebSocket.Server({ host: '127.0.0.1', port: this.port });
      this.wss.on('connection', (ws) => {
        ws.on('message', (data) => {
          this.onData(data, ws);
        });
      });
    } else {
      this.ws = new WebSocket(`ws://127.0.0.1:${this.port}/`);
      this.connectPromise = new Promise((resolve) => {
        this?.ws?.on('open', () => resolve(this.ws));
      });
      this.ws.on('message', this.onData.bind(this));
    }
  }

  getConnectPromise() {
    return this.connectPromise;
  }

  error(...args: any[]) {
    Array.prototype.unshift.call(args, this.logPrefix);
    console.error.apply(null, args);
  }

  log(...args: any[]) {
    Array.prototype.unshift.call(args, this.logPrefix);
    console.log.apply(null, args);
  }

  close() {
    if (this.isServer) {
      this?.wss?.close();
    } else {
      this?.ws?.close();
    }
  }

  /**
   * @method onData
   * @param {Buffer} buf
   *
   * Called anytime a new message has been received.
   */
  onData(buf: WebSocket.Data, ws: WebSocket) {
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
    this.verbose && this.log('Rcvd:', data);

    // validate the message before forwarding to handler
    if (!this.validate({ message: data })) {
      console.error('Invalid message received:', data);
    }

    this.onMsg(data, ws);
  }
}
