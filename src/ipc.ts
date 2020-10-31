import Ajv, {ValidateFunction} from 'ajv';
import fs from 'fs';
import path from 'path';
import WebSocket from 'ws';
import {Message2} from './schema';

export class IpcSocket {

  private isServer: boolean;

  private port: number;

  private onMsg: (_data: Message2, _ws: WebSocket) => void;

  private logPrefix: string;

  private verbose: boolean;

  private validate?: ValidateFunction;

  private wss?: WebSocket.Server;

  private ws?: WebSocket;

  private connectPromise?: Promise<WebSocket>;

  constructor(isServer: boolean, port: number,
              onMsg: (_data: Message2, _ws: WebSocket) => void,
              logPrefix: string, {verbose}: Record<string, unknown> = {}) {
    this.isServer = isServer;
    this.port = port;
    this.onMsg = onMsg;
    this.logPrefix = logPrefix;
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
      const filePath = path.join(baseDir, 'messages', fname);
      schemas.push(JSON.parse(fs.readFileSync(filePath).toString()));
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
        this?.ws?.on('open', () => resolve(this.ws));
      });
      this.ws.on('message', this.onData.bind(this));
    }
  }

  getConnectPromise(): Promise<WebSocket> | undefined {
    return this.connectPromise;
  }

  error(...args: unknown[]): void {
    Array.prototype.unshift.call(args, this.logPrefix);
    console.error.apply(null, args);
  }

  log(...args: unknown[]): void {
    Array.prototype.unshift.call(args, this.logPrefix);
    console.log.apply(null, args);
  }

  close(): void {
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
  onData(buf: WebSocket.Data, ws: WebSocket): void {
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
    if (this.validate && !this.validate({message: data})) {
      console.error('Invalid message received:', data);
    }

    this.onMsg(data, ws);
  }
}
