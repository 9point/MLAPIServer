const DB = require('../db');
const GRPCUtils = require('../grpc-utils');
const WorkerDirective = require('../models/WorkerDirective');

const assert = require('assert');

class WorkerConnection {
  constructor(worker) {
    this._closeListeners = [];
    this._config = null;
    this._isConfigured = false;
    this._isStopped = false;
    this._directiveListeners = [];
    this._worker = worker;
  }

  configure(config) {
    assert(!this._isConfigured);
    assert(!this._isStopped);

    config.call.on(
      'data',
      GRPCUtils.ErrorUtils.handleStreamError(config.call, this._onData),
    );
    config.call.on(
      'end',
      GRPCUtils.ErrorUtils.handleStreamError(config.call, this._onEnd),
    );

    this._config = config;
    this._isConfigured = true;
  }

  stop() {
    if (!this._isConfigured) {
      return;
    }

    this._config.call.end();

    this._isConfigured = false;
    this._isStopped = true;
  }

  _onData = async (request) => {
    const directive = WorkerDirective.create({
      directiveType: 'TO_SERVICE',
      payload: JSON.parse(request.getPayload()),
      payloadKey: request.getPayloadKey(),
      workerID: request.getWorkerId(),
    });
    await DB.genSetModel(WorkerDirective, directive);

    for (const listener of this._directiveListeners) {
      if (listener.payloadKey === directive.payloadKey) {
        listener.cb(directive);
      }
    }
  };

  _onEnd = () => {
    for (const listener of this._closeListeners) {
      listener.cb();
    }
  };

  send(directive) {
    assert(this._isConfigured);
    console.log(
      `[WorkerConnection] Sending directive: ${directive.payloadKey}`,
    );

    const message = GRPCUtils.WorkerDirective.createMessage(directive);
    this._config.call.write(message);
  }

  onClose(cb) {
    const listener = { cb };
    this._closeListeners.push(listener);

    const stop = () => {
      const index = this._closeListeners.indexOf(listener);
      if (index < 0) {
        return;
      }
      this._closeListeners.splice(index, 1);
    };

    return { stop };
  }

  onDirective(payloadKey, cb) {
    const listener = { cb, payloadKey };
    this._directiveListeners.push(listener);

    const stop = () => {
      const index = this._directiveListeners.indexOf(listener);
      if (index < 0) {
        return;
      }
      this._directiveListeners.splice(index, 1);
    };

    return { stop };
  }
}

module.exports = WorkerConnection;
