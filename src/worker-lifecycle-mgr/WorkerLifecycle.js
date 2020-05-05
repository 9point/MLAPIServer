const DB = require('../db');
const Worker = require('../models-DEPRECATED/Worker');
const WorkerDirective = require('../models-DEPRECATED/WorkerDirective');
const WorkerDirectiveConnection = require('./WorkerDirectiveConnection');

const assert = require('assert');

class WorkerLifecycle {
  constructor(worker) {
    this._directiveConnection = null;
    this._directiveConnectionSubscriptions = [];
    this._heartbeatState = null;
    this._isConfigured = false;
    this._listeners = [];
    this._runningTask = null;
    this._worker = worker;
  }

  // ---------------------------------------------------------------------------
  // GETTERS
  // ---------------------------------------------------------------------------

  get worker() {
    return this._worker;
  }

  get status() {
    return this._worker.status;
  }

  get projectID() {
    return this._worker.projectRef.refID;
  }

  // ---------------------------------------------------------------------------
  // SETUP
  // ---------------------------------------------------------------------------

  configure() {
    console.log('[WorkerLifecycle] Configuring...');
    assert(!this._isConfigured);
    this._isConfigured = true;
  }

  cleanup() {
    console.log('[WorkerLifecycle] Cleaning up...');
    this._directiveConnectionSubscriptions.forEach((s) => s.stop());
    this._directiveConnectionSubscriptions = [];
    this._listeners = [];

    this._directiveConnection && this._directiveConnection.stop();
  }

  startDirectiveConnection(config) {
    assert(config.workerID === this.worker.id);

    if (this._directiveConnection) {
      this._directiveConnection.stop();
      this._directiveConnection = null;
      this._directiveConnectionSubscriptions.forEach((s) => s.stop());
      this._directiveConnectionSubscriptions = [];
    }

    const connection = new WorkerDirectiveConnection(this.worker);
    connection.configure(config);

    this._directiveConnection = connection;

    this._directiveConnectionSubscriptions.push(
      connection.onDirective('v1.heartbeat.give_pulse', this._onHeartbeatPulse),
      connection.onDirective('v1.info.give_status', this._onTaskStatus),
      connection.onDirective('v1.log', this._onLog),
      connection.onDirective('v1.task.completed', this._onTaskCompleted),
      connection.onDirective('v1.task.starting', this._onTaskStarting),
      connection.onClose(this._onCloseDirectiveConnection),
      this._createHeartbeatState(),
      this._startHeartbeat(),
    );

    return connection;
  }

  // ---------------------------------------------------------------------------
  // PUBLIC METHODS
  // ---------------------------------------------------------------------------

  runTask(task, workflowRun) {
    assert(this._runningTask === null);
    assert(this.status === 'IDLE');
    assert(this._directiveConnection);

    const config = {
      projectID: task.projectRef.refID,
      taskName: task.name,
      workflowRunID: workflowRun.id,
      workerID: this._worker.id,
    };

    const directive = WorkerDirective.create.task.requestStart(config);

    this._directiveConnection.send(directive);
    this._runningTask = task;
  }

  // ---------------------------------------------------------------------------
  // LISTENERS
  // ---------------------------------------------------------------------------

  onTaskRunStart(cb) {
    return this._addListener({ cb, event: 'taskRunStart' });
  }

  onTaskRunComplete(cb) {
    return this._addListener({ cb, event: 'taskRunComplete' });
  }

  onClose(cb) {
    return this._addListener({ cb, event: 'connectionClose' });
  }

  // ---------------------------------------------------------------------------
  // PRIVATE HELPERS
  // ---------------------------------------------------------------------------

  async _setWorkerStatus(status) {
    if (status === this.status) {
      return;
    }

    console.log('[WorkerLifecycle] Setting status to:', status);
    this._worker = Worker.set(this._worker, { status });
    await DB.genSetModel(Worker, this._worker);
  }

  _addListener(listener) {
    this._listeners.push(listener);

    const stop = () => {
      const index = this._listeners.indexOf(listener);
      if (index < 0) {
        return;
      }
      this._listeners.splice(index, 1);
    };
    return { stop };
  }

  _sendEvent(name, payload) {
    for (const listener of this._listeners) {
      if (listener.event === name) {
        listener.cb(payload);
      }
    }
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
      this._directiveConnection,
      'Must establish connection before starting heartbeat.',
    );

    const HEARTBEAT_INTERVAL_MS = 60000;

    const heartbeat = async () => {
      if (!this._directiveConnection || !this._heartbeatState) {
        // If for any reason, the connection has been closed and the heartbeat
        // has not yet been cleaned up, need to make sure not to execute
        // heartbeat directive.
        return;
      }

      const isUnresponsive = Object.keys(this._heartbeatState).length > 0;

      if (isUnresponsive) {
        this._setWorkerStatus('UNRESPONSIVE');
      }

      // Send a pulse and record the id of the pulse in the state.
      const directive = WorkerDirective.create.heartbeat.checkPulse({
        workerID: this._worker.id,
      });

      await DB.genSetModel(WorkerDirective, directive);
      this._directiveConnection.send(directive);
      this._heartbeatState[directive.payload.id] = true;
    };

    const timeoutID = setInterval(heartbeat, HEARTBEAT_INTERVAL_MS);

    // In addition to scheduling the heartbeat interval, we should do an
    // initial call.
    heartbeat();

    const stop = () => {
      clearInterval(timeoutID);
    };

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

  _onCloseDirectiveConnection = () => {
    this._sendEvent('connectionClose');
  };

  // ---------------------------------------------------------------------------
  // DIRECTIVE ROUTING
  // ---------------------------------------------------------------------------

  _onLog = (directive) => {
    console.log('[WorkerLifecycle] Received log.');
  };

  _onHeartbeatPulse = (directive) => {
    if (!this._heartbeatState) {
      // TODO: Add warning.

      // Could be that there is a delay between when the connection is
      // property closed and when the heartbeat state is cleaned up. Should
      // guard against this issue.
      return;
    }

    // TODO: Add proper type checking and error handling for the payload.
    const { status } = directive.payload;
    this._heartbeatState = {};
    this._setWorkerStatus(status);
  };

  _onTaskStarting = (directive) => {
    // TODO: Assert this is the same task that is running.
    assert(this._runningTask);

    this._sendEvent('taskRunStart', { task: this._runningTask });
  };

  _onTaskCompleted = (directive) => {
    // TODO: Assert this is the same task that is running.
    assert(this._runningTask);

    const task = this._runningTask;
    this._runningTask = null;

    this._sendEvent('taskRunComplete', { task });
  };
}

module.exports = WorkerLifecycle;
