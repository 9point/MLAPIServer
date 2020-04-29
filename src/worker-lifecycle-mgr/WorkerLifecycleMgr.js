const DB = require('../db');
const GRPCUtils = require('../grpc-utils');
const Task = require('../models/Task');
const Worker = require('../models/Worker');
const WorkerLifecycle = require('./WorkerLifecycle');
const WorkflowRun = require('../models/WorkflowRun');
const WorkflowRunState = require('../models/WorkflowRunState');

const assert = require('assert');

class WorkerLifecycleMgr {
  constructor() {
    this._isConfigured = false;
    this._lifecycles = [];
    this._pendingConnectionConfigurations = [];
    this._subscriptions = [];
    this._workflowRunMgr = {};
  }

  // ---------------------------------------------------------------------------
  // SETUP
  // ---------------------------------------------------------------------------

  async configure() {
    assert(!this._isConfigured);

    const ACTIVE_STATUSES = ['IDLE', 'INITIALIZING', 'WORKING'];
    const query = DB.createQuery(Worker, (_) =>
      _.where('isDeleted', '==', false).where('status', 'in', ACTIVE_STATUSES),
    );

    // Any workers that exist before this service is run should be deleted.
    // Note that this won't work well when multiple instances of the service
    // are running. The purpose of this code is for the service to be started
    // and stopped without causing a bad state for the workers.

    const workers = await DB.genRunQuery(query);
    console.log(
      `[WorkerLifecycleMgr] Found ${workers.length} worker(s) during initializing.`,
    );
    await Promise.all(workers.map((w) => DB.genDeleteModel(Worker, w)));

    console.log('[WorkerLifecycleMgr] Setting up listener for workers...');
    this._subscriptions.push(DB.listenQuery(query, this._onChangeWorkers));

    this._isConfigured = true;
  }

  // ---------------------------------------------------------------------------
  // CONNECTION
  // ---------------------------------------------------------------------------

  registerDirectiveRouter(call) {
    // Wait for a ready signal from the worker.
    const onData = (request) => {
      if (isDone) {
        return;
      }

      const payloadKey = request.getPayloadKey();

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

  _checkForResolvedConnections() {
    const resolvedConfigs = [];

    for (const config of this._pendingConnectionConfigurations) {
      const { workerID } = config;

      const lifecycle = this._lifecycles.find(
        (lc) => lc.worker.id === workerID,
      );

      if (lifecycle) {
        lifecycle.startDirectiveConnection(config);
        resolvedConfigs.push(config);
      }
    }

    if (this._pendingConnectionConfigurations.length > 0) {
      console.log(
        `${resolvedConfigs.length} of ${this._pendingConnectionConfigurations.length} connection(s) resolved.`,
      );
    }

    this._pendingConnectionConfigurations = this._pendingConnectionConfigurations.filter(
      (config) => !resolvedConfigs.includes(config),
    );
  }

  // ---------------------------------------------------------------------------
  // PUBLIC METHODS
  // ---------------------------------------------------------------------------

  async genRunWorkflow(workflow) {
    // Check for any workers that exist for the current project.

    // TODO: For now, workers need to be online and ready for a workflow
    // to be run. Could support in the future the ability to have a workflow
    // run pending for a set of workers.

    const projectID = workflow.projectRef.refID;
    const lifecycles = this._lifecycles.filter(
      (lc) => lc.projectID === projectID && lc.status === 'IDLE',
    );

    if (lifecycles.length === 0) {
      throw Error(
        `Cannot run workflow ${workflow.id}. There are no idle workers.`,
      );
    }

    // For now, we are assuming there is 1 task per workflow.
    // So we just need to find the task associated with the workflow and
    // run it with one of the available workers.
    const taskQuery = DB.createQuery(Task, (_) =>
      _.where('isDeleted', '==', false).where(
        'projectRef.refID',
        '==',
        projectID,
      ),
    );
    const task = await DB.genRunQueryOne(taskQuery);

    if (!task) {
      throw Error(`No task found for project ${projectID}`);
    }

    const workflowID = workflow.id;
    const workflowRun = WorkflowRun.create({ workflowID });
    const workflowRunState = WorkflowRunState.create({
      workflowRunID: workflowRun.id,
    });

    await Promise.all([
      DB.genSetModel(WorkflowRun, workflowRun),
      DB.genSetModel(WorkflowRunState, workflowRunState),
    ]);

    this._workflowRunMgr[workflowRun.id] = {
      lifecycles: [lifecycles[0]],
      projectID,
      workflow,
      workflowRun,
      workflowRunState,
    };

    lifecycles[0].runTask(task, workflowRun);

    return workflowRun;
  }

  // ---------------------------------------------------------------------------
  // EVENTS / CALLBACKS
  // ---------------------------------------------------------------------------

  _onChangeWorkers = (change) => {
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
      this._subscriptions.push(
        lifecycle.onTaskRunStart(this._onTaskRunStart.bind(this, lifecycle)),
        lifecycle.onTaskRunComplete(
          this._onTaskRunComplete.bind(this, lifecycle),
        ),
        lifecycle.onClose(this._onCloseLifecycle.bind(this, lifecycle)),
      );
    }

    this._checkForResolvedConnections();
  };

  _onCloseLifecycle = async (lifecycle) => {
    const worker = lifecycle.worker;
    await DB.genDeleteModel(Worker, worker);
    lifecycle.cleanup();

    const index = this._lifecycles.indexOf(lifecycle);
    if (index >= 0) {
      this._lifecycles.splice(index, 1);
    }

    console.log(
      `Lifecycle closed. Total remaining: ${this._lifecycles.length}`,
    );
  };

  _onTaskRunStart = async (lifecycle, payload) => {
    console.log('[WorkerLifecycleMgr] Started task');

    const { task } = payload;

    const runDetails = Object.values(this._workflowRunMgr).find((details) => {
      return details.lifecycles.includes(lifecycle);
    });

    assert(runDetails);

    const workflowRunState = WorkflowRunState.addActiveTaskIDs(
      runDetails.workflowRunState,
      [task.id],
    );

    await DB.genSetModel(WorkflowRunState, workflowRunState);
  };

  _onTaskRunComplete = async (lifecycle, payload) => {
    console.log('[WorkerLifecycleMgr] Completed task');

    const { task } = payload;

    const runDetails = Object.values(this._workflowRunMgr).find((details) => {
      return details.lifecycles.includes(lifecycle);
    });

    assert(runDetails);

    const workflowRunState = WorkflowRunState.addCompletedTaskIDs(
      runDetails.workflowRunState,
      [task.id],
    );

    await DB.genSetModel(WorkflowRunState, workflowRunState);
  };
}

module.exports = WorkerLifecycleMgr;
