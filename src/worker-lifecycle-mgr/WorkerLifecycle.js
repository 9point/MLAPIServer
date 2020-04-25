const DB = require('../db');
const Worker = require('../models/Worker');
const WorkerConnection = require('./WorkerConnection');
const WorkerDirective = require('../models/WorkerDirective');

const assert = require('assert');

class WorkerLifecycle {
  constructor(worker) {
    this._connection = null;
    this._connectionSubscriptions = [];
    this._heartbeatState = null;
    this._isConfigured = false;
    this._worker = worker;
  }

  get worker() {
    return this._worker;
  }

  get status() {
    return this._worker.status;
  }

  get projectID() {
    return this._worker.projectRef.refID;
  }

  configure() {
    assert(!this._isConfigured);
    this._isConfigured = true;
  }

  cleanup() {
    this._connectionSubscriptions.forEach((s) => s.stop());
    this._connectionSubscriptions = [];
  }

  startConnection(config) {
    assert(config.workerID === this.worker.id);

    if (this._connection) {
      this._connection.stop();
      this._connection = null;
      this._connectionSubscriptions.forEach((s) => s.stop());
      this._connectionSubscriptions = [];
    }

    const connection = new WorkerConnection(this.worker);
    connection.configure(config);

    this._connection = connection;

    this._connectionSubscriptions.push(
      connection.onDirective('v1.heartbeat.give_pulse', this._onHeartbeatPulse),
      connection.onDirective('v1.info.give_status', this._onTaskStatus),
      connection.onDirective('v1.task.completed', this._onTaskCompleted),
      connection.onDirective('v1.task.starting', this._onTaskStarting),
      connection.onClose(this._onCloseConnection),
      this._createHeartbeatState(),
      this._startHeartbeat(),
    );

    return connection;
  }

  async _setWorkerStatus(status) {
    console.log('setting status to', status);
    this._worker = Worker.set(this._worker, { status });
    await DB.genSetModel(Worker, this._worker);
  }

  // ---------------------------------------------------------------------------
  // HEARTBEAT MANAGEMENT
  // ---------------------------------------------------------------------------

  _startHeartbeat() {
    assert(
      this._heartbeatState,
      'Must initialize heartbeat state before starting heartbeat.',
    );

    assert(
      this._connection,
      'Must establish connection before starting heartbeat.',
    );

    const HEARTBEAT_INTERVAL_MS = 10000;

    const heartbeat = async () => {
      if (!this._connection || !this._heartbeatState) {
        // If for any reason, the connection has been closed and the heartbeat
        // has not yet been cleaned up, need to make sure not to execute
        // heartbeat directive.
        return;
      }

      // First check for any pulses that have not been responded to. If
      // any are found, mark the worker as non-responsive.
      const isUnresponsive = Object.keys(this._heartbeatState).length > 0;

      if (isUnresponsive) {
        this._setWorkerStatus('UNRESPONSIVE');
      }

      if (!isUnresponsive && this.status === 'INITIALIZING') {
        this._setWorkerStatus('IDLE');
      }

      if (!isUnresponsive && this.status === 'UNRESPONSIVE') {
        // If a worker is marked as unresponsive, but then becomes responsive,
        // need to update its status.
        const requestStatus = WorkerDirective.create.heartbeat.checkStatus({
          workerID: this._worker.id,
        });
        this._connection.send(requestStatus);
      }

      // Send a pulse and record the id of the pulse in the state.
      const directive = WorkerDirective.create.heartbeat.checkPulse({
        workerID: this._worker.id,
      });

      await DB.genSetModel(WorkerDirective, directive);
      this._connection.send(directive);
      this._heartbeatState[directive.payload.id] = true;
    };

    const timeoutID = setInterval(heartbeat, HEARTBEAT_INTERVAL_MS);
    function stop() {
      clearInterval(timeoutID);
    }

    return { stop };
  }

  _createHeartbeatState() {
    this._heartbeatState = {};

    const stop = () => {
      this._heartbeatState = null;
    };

    return { stop };
  }

  // ---------------------------------------------------------------------------
  // CALLBACKS
  // ---------------------------------------------------------------------------

  _onCloseConnection = () => {
    console.log('connection closed');
  };

  // ---------------------------------------------------------------------------
  // DIRECTIVE ROUTING
  // ---------------------------------------------------------------------------

  _onHeartbeatPulse = (directive) => {
    if (!this._heartbeatState) {
      // TODO: Add warning.

      // Could be that there is a delay between when the connection is
      // property closed and when the heartbeat state is cleaned up. Should
      // guard against this issue.
      return;
    }

    // TODO: Add proper type checking and error handling for the payload.
    const { id } = directive.payload;
    delete this._heartbeatState[id];
  };

  _onTaskStarting = (directive) => {
    console.log('task starting');
    this._setWorkerStatus('WORKING');
  };

  _onTaskCompleted = (directive) => {
    console.log('task completed');
    this._setWorkerStatus('IDLE');
  };

  _onTaskGiveStatus = (directive) => {
    console.log('giving status');
    // TODO: Add proper type checking and error handling for payload.
    const { status } = directive.payload;
    this._setWorkerStatus(status);
  };
}

module.exports = WorkerLifecycle;
