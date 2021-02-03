import Ajv, { ValidateFunction } from 'ajv';
import fs from 'fs';
import path from 'path';
import WebSocket from 'ws';
import { Message } from './schema';

export class IpcSocket {
  private isServer: boolean;

  private port: number;

  private onMsg: (_data: Message, _ws: WebSocket) => void;

  private logPrefix: string;

  private verbose: boolean;

  private validators: Record<number, ValidateFunction> = {};

  private wss?: WebSocket.Server;

  private ws?: WebSocket;

  private connectPromise?: Promise<WebSocket>;

  constructor(
    isServer: boolean,
    port: number,
    onMsg: (_data: Message, _ws: WebSocket) => void,
    logPrefix: string,
    { verbose }: Record<string, unknown> = {}
  ) {
    this.isServer = isServer;
    this.port = port;
    this.onMsg = onMsg;
    this.logPrefix = logPrefix;
    this.verbose = !!verbose;

    // Build the JSON-Schema validator for incoming messages
    const baseDir = path.resolve(path.join(__dirname, '..', 'schema'));
    const schemas = [];

    // top-level schema
    schemas.push(JSON.parse(fs.readFileSync(path.join(baseDir, 'schema.json')).toString()));

    // individual message schemas
    for (const fname of fs.readdirSync(path.join(baseDir, 'messages'))) {
      const filePath = path.join(baseDir, 'messages', fname);
      schemas.push(JSON.parse(fs.readFileSync(filePath).toString()));
    }

    for (const schema of schemas) {
      if (schema?.properties?.messageType) {
        const validate = new Ajv({ schemas }).getSchema(schema.$id);
        if (validate) {
          this.validators[schema.properties.messageType.const] = validate;
        }
      } else {
        console.debug(`Ignoring ${schema.$id} because it has no messageType`);
      }
    }

    if (this.isServer) {
      this.wss = new WebSocket.Server({ host: '127.0.0.1', port: this.port });
      this.wss.on('connection', (ws) => {
        ws.on('message', (data) => {
          this.onData(data, ws);
        });
      });
    } else {
      const ws = new WebSocket(`ws://127.0.0.1:${this.port}/`);
      this.ws = ws;
      this.connectPromise = new Promise((resolve) => {
        ws.on('open', () => resolve(ws));
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
    const messageType = data.messageType;

    if (typeof messageType !== 'undefined') {
      if (messageType in this.validators) {
        const validator = this.validators[messageType];

        if (!validator(data)) {
          const dataJson = JSON.stringify(data, null, 2);
          const errorJson = JSON.stringify(validator.errors, null, 2);
          console.error(`Invalid message received: ${dataJson}`);
          console.error(`Validation error: ${errorJson}`);
        }
      } else {
        console.error(`Unknown messageType ${messageType}`);
      }
    } else {
      console.error(`Message ${bufStr} has no messageType`);
    }

    this.onMsg(data, ws);
  }
}
