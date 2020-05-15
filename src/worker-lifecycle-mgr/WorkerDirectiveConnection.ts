import * as DB from '../db-DEPRECATED';
import * as GRPCErrorUtils from '../grpc-utils/error-utils';
import * as GRPCWorkerDirective from '../grpc-utils/WorkerDirective';
import WorkerDirectiveModule, {
  Model as WorkerDirective,
} from '../models/WorkerDirective';

import assert from 'assert';

import { EndpointCallWritable, Message } from '../grpc-utils/types';
import { Model as Worker } from '../models/Worker';
import { Subscription } from '../types';

interface Listener {
  cb: (param: any) => void;
  key: string;
}

export interface ConnectionConfig {
  call: EndpointCallWritable;
  workerID: string;
}

export default class WorkerDirectiveConnection {
  private closeListeners: Listener[] = [];
  private config: ConnectionConfig | null = null;
  private directiveListeners: Listener[] = [];
  private isClosed: boolean = false;
  private isConfigured: boolean = false;
  private isStopped = false;
  private worker: Worker;

  constructor(worker: Worker) {
    this.worker = worker;
  }

  public configure(config: ConnectionConfig) {
    assert(!this.isConfigured);
    assert(!this.isStopped);
    assert(!this.isClosed);

    const { call } = config;
    call.on('data', GRPCErrorUtils.handleStreamError(call, this.onData));
    call.on('end', GRPCErrorUtils.handleStreamError(call, this.onEnd));

    this.config = config;
    this.isConfigured = true;
  }

  public stop() {
    if (!this.isConfigured) {
      return;
    }

    assert(this.config);

    this.config.call.end();

    this.isConfigured = false;
    this.isStopped = true;
  }

  private onData = async (request: Message) => {
    const directive = WorkerDirectiveModule.create({
      directiveType: 'WORKER_TO_SERVICE',
      fromWorkerID: request.getFromWorkerId(),
      payload: JSON.parse(request.getPayload()),
      payloadKey: request.getPayloadKey(),
      toWorkerID: null,
    });
    await DB.genSetModel(WorkerDirectiveModule, directive);

    let foundListener = false;
    for (const listener of this.directiveListeners) {
      if (listener.key === directive.payloadKey) {
        foundListener = true;
        listener.cb(directive);
      }
    }

    if (!foundListener) {
      console.log(
        `[WorkerDirectiveConnection] No listeners for directive: ${directive.payloadKey}`,
      );
    }
  };

  private onEnd = () => {
    this.isConfigured = false;
    this.isClosed = true;

    for (const listener of this.closeListeners) {
      listener.cb({});
    }
  };

  public send(directive: WorkerDirective) {
    assert(this.isConfigured);
    assert(this.config);

    console.log(
      `[WorkerDirectiveConnection] Sending directive: ${directive.payloadKey}`,
    );

    DB.genSetModel(WorkerDirectiveModule, directive);
    const message = GRPCWorkerDirective.createMessage(directive);
    this.config.call.write(message);
  }

  public onClose(cb: () => void): Subscription {
    const listener = { cb, key: 'close' };
    this.closeListeners.push(listener);

    const stop = () => {
      const index = this.closeListeners.indexOf(listener);
      if (index < 0) {
        return;
      }
      this.closeListeners.splice(index, 1);
    };

    return { stop };
  }

  public onDirective(
    payloadKey: string,
    cb: (directive: WorkerDirective) => void,
  ): Subscription {
    const listener = { cb, key: payloadKey };
    this.directiveListeners.push(listener);

    const stop = () => {
      const index = this.directiveListeners.indexOf(listener);
      if (index < 0) {
        return;
      }
      this.directiveListeners.splice(index, 1);
    };

    return { stop };
  }
}
