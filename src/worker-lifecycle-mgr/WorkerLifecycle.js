const DB = require('../db');
const WorkerConnection = require('./WorkerConnection');

const assert = require('assert');

class WorkerLifecycle {
  constructor(worker) {
    this._connection = null;
    this._isConfigured = false;
    this._subscriptions = [];
    this._worker = worker;
  }

  get worker() {
    return this._worker;
  }

  configure() {
    assert(!this._isConfigured);
    this._isConfigured = true;
  }

  cleanup() {
    this._subscriptions.forEach((s) => s.stop());
    this._subscriptions = [];
  }

  startConnection(config) {
    assert(config.workerID === this.worker.id);

    if (this._connection) {
      this._connection.stop();
      this._connection = null;
    }

    const connection = new WorkerConnection(this.worker);
    connection.configure(config);

    this._connection = connection;

    return connection;
  }

  _onChangeWorker(change) {
    console.log('_onChangeWorker');
    console.log(change);
  }

  _onChangeDirectives(change) {
    console.log('_onChangeDirectives');
    console.log(change);
  }
}

module.exports = WorkerLifecycle;
