const DB = require('../db');
const GRPCUtils = require('../grpc-utils');
const Worker = require('../models/Worker');
const WorkerLifecycle = require('./WorkerLifecycle');

const assert = require('assert');

class WorkerLifecycleMgr {
  constructor() {
    this._isConfigured = false;
    this._lifecycles = [];
    this._pendingConnectionConfigurations = [];
    this._subscriptions = [];
  }

  configure() {
    assert(!this._isConfigured);

    const workerQuery = DB.createQuery(Worker, (_) =>
      _.where('isDeleted', '==', false).where('status', 'in', [
        'IDLE',
        'INITIALIZING',
        'WORKING',
      ]),
    );

    this._subscriptions.push(
      DB.listenQuery(workerQuery, this._onChangeWorkers),
    );

    this._isConfigured = true;
  }

  registerDirectiveRouter(call) {
    this._waitForClientReady(call);
  }

  _waitForClientReady(call) {
    const onData = (request) => {
      console.log('request received by lc mgr');
      if (isDone) {
        return;
      }

      const payloadKey = request.getPayloadKey();
      console.log('mgr processing request', payloadKey);

      if (payloadKey === 'v1.worker.ready') {
        call.off('data', callback);
        const config = { call, workerID: request.getWorkerId() };
        this._pendingConnectionConfigurations.push(config);
        this._checkForResolvedConnections();
      }
    };

    let isDone = false;
    const callback = GRPCUtils.ErrorUtils.handleStreamError(call, onData);
    call.on('data', callback);
  }

  _connect(config) {
    const lifecycle = this._lifecycles.find(
      (lc) => lc.worker.id === config.workerID,
    );

    if (!lifecycle) {
      throw Error(`No lifecycle for worker: ${config.workerID}`);
    }

    lifecycle.startConnection(config);
  }

  _onChangeWorkers = (change) => {
    console.log('changing workers');

    // TODO: Handle changed and removed workers.

    // Handle adding new lifecycles.
    const addedWorkers = change['added'] || [];

    for (const worker of addedWorkers) {
      if (this._lifecycles.some((lc) => lc.worker.id === worker.id)) {
        // Worker already exists.
        continue;
      }

      const lifecycle = new WorkerLifecycle(worker);
      lifecycle.configure();

      this._lifecycles.push(lifecycle);
    }

    this._checkForResolvedConnections();
  };

  _checkForResolvedConnections() {
    console.log('checking for resolved connections');

    const resolvedConfigs = [];

    for (const config of this._pendingConnectionConfigurations) {
      const { workerID } = config;

      const lifecycle = this._lifecycles.find(
        (lc) => lc.worker.id === workerID,
      );

      if (lifecycle) {
        lifecycle.startConnection(config);
        resolvedConfigs.push(config);
      }
    }

    console.log(
      `${resolvedConfigs.length} of ${this._pendingConnectionConfigurations.length} connection(s) resolved.`,
    );

    this._pendingConnectionConfigurations = this._pendingConnectionConfigurations.filter(
      (config) => !resolvedConfigs.includes(config),
    );
  }
}

module.exports = WorkerLifecycleMgr;
