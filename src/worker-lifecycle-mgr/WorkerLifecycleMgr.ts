import * as DB from '../db';
import * as GRPCErrorUtils from '../grpc-utils/error-utils';
import ProjectModule, { Model as Project } from '../models/Project';
import RoutineRunModule, { Model as RoutineRun } from '../models/RoutineRun';
import WorkerModule, { Model as Worker, WorkerStatus } from '../models/Worker';
import WorkerLifecycle from './WorkerLifecycle';

import assert from 'assert';
import gennullthrows from '../gennullthrows';
import nullthrows from 'nullthrows';

import { ConnectionConfig } from './WorkerDirectiveConnection';
import { EndpointCallWritable, Message } from '../grpc-utils/types';
import { FullRoutineID, toString as routineIDToString } from '../routine-id';
import { genRoutine } from '../db/utils';
import { Model as Task } from '../models/Task';
import { Model as Workflow } from '../models/Workflow';
import { Subscription } from '../types';

interface LifecycleState {
  activeRuns: RoutineRun[];
  lifecycle: WorkerLifecycle;
}

type WorkerChange = DB.Change<typeof WorkerModule.MODEL_TYPE, Worker>;

export default class WorkerLifecycleMgr {
  private isConfigured: boolean = false;
  private pendingConnectionConfigurations: ConnectionConfig[] = [];
  private lifecycleState: { [id: string]: LifecycleState } = {};
  private subscriptions: Subscription[] = [];

  private get lifecycles(): WorkerLifecycle[] {
    return Object.values(this.lifecycleState).map((s) => s.lifecycle);
  }

  // ---------------------------------------------------------------------------
  // SETUP
  // ---------------------------------------------------------------------------

  public async configure() {
    assert(!this.isConfigured);

    const activeStatuses: WorkerStatus[] = [
      'HANGING',
      'IDLE',
      'INITIALIZING',
      'UNRESPONSIVE',
      'WORKING',
    ];

    const query = DB.createQuery(WorkerModule, (_) =>
      _.where('isDeleted', '==', false).where('status', 'in', activeStatuses),
    );

    // Any workers that exist before this service is run should be deleted.
    // Note that this won't work well when multiple instances of the service
    // are running. The purpose of this code is for the service to be started
    // and stopped without causing a bad state for the workers.

    const workers = await DB.genRunQuery(query);
    console.log(
      `[WorkerLifecycleMgr] Found ${workers.length} worker(s) during initializing.`,
    );

    await Promise.all(workers.map((w) => DB.genDeleteModel(WorkerModule, w)));

    console.log('[WorkerLifecycleMgr] Setting up listener for workers...');

    this.subscriptions.push(DB.listenQuery(query, this.onChangeWorkers));
    this.isConfigured = true;
  }

  // ---------------------------------------------------------------------------
  // CONNECTION
  // ---------------------------------------------------------------------------

  public registerDirectiveRouter(call: EndpointCallWritable): void {
    console.log('[WorkerLifecycleMgr] Registering directive router...');

    // Wait for a ready signal from the worker.
    const onData = (request: Message) => {
      if (isDone) {
        return;
      }

      const payloadKey = request.getPayloadKey();

      if (payloadKey === 'v1.worker.ready') {
        console.log('[WorkerLifecycleMgr]: Worker connection ready');
        call.off('data', callback);
        const config = { call, workerID: request.getFromWorkerId() };
        this.pendingConnectionConfigurations.push(config);
        this.checkForResolvedConnections();
      }
    };

    let isDone = false;
    const callback = GRPCErrorUtils.handleStreamError(call, onData);
    call.on('data', callback);
  }

  private checkForResolvedConnections() {
    const resolvedConfigs: ConnectionConfig[] = [];

    for (const config of this.pendingConnectionConfigurations) {
      const { workerID } = config;

      const lifecycle = this.lifecycles.find((lc) => lc.worker.id === workerID);

      if (lifecycle) {
        lifecycle.startDirectiveConnection(config);
        resolvedConfigs.push(config);
      }
    }

    if (this.pendingConnectionConfigurations.length > 0) {
      console.log(
        `[WorkerLifecycleMgr] ${resolvedConfigs.length} of ${this.pendingConnectionConfigurations.length} connection(s) resolved.`,
      );
    }

    this.pendingConnectionConfigurations = this.pendingConnectionConfigurations.filter(
      (config) => !resolvedConfigs.includes(config),
    );
  }

  // ---------------------------------------------------------------------------
  // PUBLIC METHODS
  // ---------------------------------------------------------------------------

  public async genRunRoutine(
    id: FullRoutineID,
    args: Object,
  ): Promise<RoutineRun> {
    // STEP 1: PICK A WORKER TO RUN THE ROUTINE.
    // TODO: For now, workers need to be online and ready for a workflow
    // to be run. Could support in the future the ability to have a workflow
    // run pending for a set of workers.

    const lifecycles = Object.values(this.lifecycleState)
      .filter((s) => s.lifecycle.canRunRoutine(id))
      .map((s) => s.lifecycle);

    if (lifecycles.length === 0) {
      const str = routineIDToString(id);
      throw Error(
        `Cannot run routine: ${str}. There are no workers available.`,
      );
    }

    const routine = await genRoutine(id);

    if (!routine) {
      const strID = routineIDToString(id);
      throw new Error(`No routine found for id: ${strID}`);
    }

    const selectedLifecycle = lifecycles[0];

    // STEP 2: RUN THE ROUTINE.
    // TODO: For now, will assume that a worker which is asked to run the
    // routine will always successfully run the routine. This will likely not be
    // true in the future.

    selectedLifecycle.runRoutine(routine, args);

    const run = RoutineRunModule.create({
      parentRunID: null,
      requestingWorkerID: null,
      runningWorkerID: selectedLifecycle.worker.id,
      routineDBID: routine.id,
    });

    await DB.genSetModel(RoutineRunModule, run);

    // STEP 3: REGISTER THE RUNNING ROUTINE.
    this.lifecycleState[selectedLifecycle.worker.id].activeRuns.push(run);

    return run;
  }

  // ---------------------------------------------------------------------------
  // EVENTS / CALLBACKS
  // ---------------------------------------------------------------------------

  private onChangeWorkers = async (change: WorkerChange) => {
    // TODO: Handle changed and removed workers.

    // Handle adding new lifecycles.
    const addedWorkers = change['added'] || [];
    const projects = await Promise.all(
      addedWorkers.map((w) =>
        gennullthrows(DB.genFetchModel(ProjectModule, w.projectRef.refID)),
      ),
    );

    for (const worker of addedWorkers) {
      if (this.lifecycleState[worker.id]) {
        // Worker already exists.
        continue;
      }

      const project = nullthrows(
        projects.find((p) => p.id === worker.projectRef.refID),
      );

      const lifecycle = new WorkerLifecycle(worker, project);
      lifecycle.configure();

      this.lifecycleState[worker.id] = { activeRuns: [], lifecycle };

      this.subscriptions.push(
        lifecycle.onStartRoutineRun(
          this.onStartRoutineRun.bind(this, lifecycle),
        ),
        lifecycle.onCompleteRoutineRun(
          this.onCompleteRoutineRun.bind(this, lifecycle),
        ),
        lifecycle.onCloseConnection(
          this.onCloseLifecycleConnection.bind(this, lifecycle),
        ),
      );
    }

    this.checkForResolvedConnections();
  };

  private onCloseLifecycleConnection = async (lifecycle: WorkerLifecycle) => {
    const worker = lifecycle.worker;
    await DB.genDeleteModel(WorkerModule, worker);
    lifecycle.cleanup();

    const workerID = lifecycle.worker.id;
    delete this.lifecycleState[workerID];

    console.log(
      `[WorkerLifecycleMgr] Lifecycle closed. Total remaining: ${this.lifecycles.length}`,
    );
  };

  private onStartRoutineRun = async (
    lifecycle: WorkerLifecycle,
    payload: any,
  ) => {
    console.log('[WorkerLifecycleMgr] Started routine');

    // Find the run associated with this routine.
    const routine: Task | Workflow = payload.routine;
    const state = this.lifecycleState[lifecycle.worker.id];

    let run = state.activeRuns.find((r) => r.routineRef.refID === routine.id);
    assert(run);

    run = RoutineRunModule.set(run, { status: 'RUNNING' });
    await DB.genSetModel(RoutineRunModule, run);
  };

  private onCompleteRoutineRun = async (
    lifecycle: WorkerLifecycle,
    payload: any,
  ) => {
    console.log('[WorkerLifecycleMgr] Completed routine');

    const routine: Task | Workflow = payload.routine;
    const state = this.lifecycleState[lifecycle.worker.id];

    let run = state.activeRuns.find((r) => r.routineRef.refID === routine.id);
    assert(run);

    run = RoutineRunModule.set(run, { status: 'DONE' });
    await DB.genSetModel(RoutineRunModule, run);
  };
}
