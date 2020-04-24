const DB = require('../db');
const GRPCUtils = require('../grpc-utils');
const WorkerDirective = require('../models/WorkerDirective');

const assert = require('assert');

const { v4: uuidv4 } = require('uuid');

const HEARTBEAT_INTERVAL_MS = 10000;

class WorkerConnection {
  constructor(worker) {
    this._config = null;
    this._heartbeatID = null;
    this._isConfigured = false;
    this._isStopped = false;
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

    this._startHeartbeat();

    this._config = config;
    this._isConfigured = true;
  }

  stop() {
    if (!this._isConfigured) {
      return;
    }

    this._config.call.end();
    this._heartbeatID && clearInterval(this._heartbeatID);

    this._heartbeatID = null;
    this._isConfigured = false;
    this._isStopped = true;
  }

  _startHeartbeat() {
    console.log('starting heartbeat');
    assert(!this._heartbeatID);

    const worker = this._worker;

    const heartbeat = async () => {
      console.log('heartbeat');
      const directive = WorkerDirective.create({
        directiveType: 'TO_WORKER',
        payload: { id: uuidv4() },
        payloadKey: 'v1.heartbeat.check_pulse',
        workerID: worker.id,
      });
      await DB.genSetModel(WorkerDirective, directive);

      this._send(directive);
    };

    this._heartbeatID = setInterval(heartbeat, HEARTBEAT_INTERVAL_MS);
  }

  async _onData(request) {
    console.log('receiving request');
    console.log(request);
    const directive = WorkerDirective.create({
      directiveType: 'TO_SERVICE',
      payload: JSON.parse(request.getPayload()),
      payloadKey: request.getPayloadKey(),
      workerID: request.getWorkerId(),
    });
    await DB.genSetModel(WorkerDirective, directive);
  }

  _onEnd() {
    console.log('connection ended.');
    // TODO: Update the worker status to show it is closed.
  }

  _send(directive) {
    assert(this._isConfigured);
    const message = GRPCUtils.WorkerDirective.createMessage(directive);
    this._config.call.write(message);
  }
}

module.exports = WorkerConnection;
