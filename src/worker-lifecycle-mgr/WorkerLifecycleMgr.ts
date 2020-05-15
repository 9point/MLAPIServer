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
import {
  createNameBasedID as createNameBasedRoutineID,
  FullRoutineID,
  toString as routineIDToString,
} from '../routine-id';
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
  private lifecycles: WorkerLifecycle[] = [];
  private pendingConnectionConfigurations: ConnectionConfig[] = [];
  private routineRuns: RoutineRun[] = [];
  private subscriptions: Subscription[] = [];

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
  // ROUTINE RUN
  // ---------------------------------------------------------------------------

  public async genRunRoutine(
    id: FullRoutineID,
    localRunID: string,
    args: Object,
  ): Promise<RoutineRun> {
    return await this.genRunRoutineImpl(
      id,
      localRunID,
      null /* parentRunID */,
      args,
      null /* fromWorkerID */,
    );
  }

  private async genRunRoutineImpl(
    id: FullRoutineID,
    localRunID: string,
    parentRunID: string | null,
    args: Object,
    fromWorkerID: string | null,
  ): Promise<RoutineRun> {
    console.log('[WorkerLifecycleMgr] Running routine');

    const routine = await genRoutine(id);

    if (!routine) {
      const strID = routineIDToString(id);
      throw new Error(`No routine found for id: ${strID}`);
    }

    // TODO: For now, workers need to be online and ready for a workflow
    // to be run. Could support in the future the ability to have a workflow
    // run pending for a set of workers.

    const selectedLifecycle = this.selectLifecycle(id);

    if (!selectedLifecycle) {
      const str = routineIDToString(id);
      throw Error(
        `Cannot run routine: ${str}. There are no workers available.`,
      );
    }

    const run = RoutineRunModule.create({
      localRunID,
      parentRunID,
      requestingWorkerID: fromWorkerID,
      runningWorkerID: selectedLifecycle.worker.id,
      routineDBID: routine.id,
      routineID: createNameBasedRoutineID(routine, selectedLifecycle.project),
    });

    this.routineRuns.push(run);

    selectedLifecycle.runRoutine(
      routine,
      args,
      run.id,
      run.parentRunRef?.refID || null,
      run.localRunID,
      fromWorkerID,
    );

    await DB.genSetModel(RoutineRunModule, run);

    return run;
  }

  private selectLifecycle(routineID: FullRoutineID): WorkerLifecycle | null {
    let selectedLifecycle: WorkerLifecycle | null = null;
    let selectedRunCount: number | null = null;

    for (const lc of this.lifecycles) {
      if (!lc.canRunRoutine(routineID)) {
        continue;
      }

      const runCount = this.routineRuns.filter(
        (run) => lc.worker.id === run.runningWorkerRef.refID,
      ).length;

      if (selectedRunCount === null || runCount < selectedRunCount) {
        selectedLifecycle = lc;
        selectedRunCount = runCount;
      }
    }

    return selectedLifecycle;
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
      if (this.lifecycles.some((lc) => lc.worker.id === worker.id)) {
        // Worker already exists.
        continue;
      }

      const project = nullthrows(
        projects.find((p) => p.id === worker.projectRef.refID),
      );

      const lifecycle = new WorkerLifecycle(worker, project);
      lifecycle.configure();

      this.lifecycles.push(lifecycle);

      this.subscriptions.push(
        lifecycle.onRequestStartRoutine(
          this.onRequestStartRoutine.bind(this, lifecycle),
        ),
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

    const index = this.lifecycles.indexOf(lifecycle);
    if (index >= 0) {
      this.lifecycles.splice(index, 1);
    }

    console.log(
      `[WorkerLifecycleMgr] Lifecycle closed. Total remaining: ${this.lifecycles.length}`,
    );
  };

  private onRequestStartRoutine = async (
    lifecycle: WorkerLifecycle,
    routineID: FullRoutineID,
    localRunID: string,
    parentRunID: string,
    args: Object,
  ) => {
    this.genRunRoutineImpl(
      routineID,
      localRunID,
      parentRunID,
      args,
      lifecycle.worker.id,
    );
  };

  private onStartRoutineRun = async (
    lifecycle: WorkerLifecycle,
    routineID: FullRoutineID,
    runID: string,
  ) => {
    console.log('[WorkerLifecycleMgr] Started routine');

    let run = this.routineRuns.find((r) => r.id === runID);
    assert(run);

    run = RoutineRunModule.set(run, { status: 'RUNNING' });
    await DB.genSetModel(RoutineRunModule, run);

    // Forward the info to the requesting worker / lifecycle.
    if (run.requestingWorkerRef) {
      const requestingWorkerID = run.requestingWorkerRef.refID;
      const requestingLC = this.lifecycles.find(
        (lc) => lc.worker.id === requestingWorkerID,
      );
      assert(requestingLC);

      const fromWorkerID = lifecycle.worker.id;
      requestingLC.runStarting(fromWorkerID, routineID, run.id, run.localRunID);
    }
  };

  private onCompleteRoutineRun = async (
    lifecycle: WorkerLifecycle,
    routineID: FullRoutineID,
    runID: string,
    result: Object,
  ) => {
    console.log('[WorkerLifecycleMgr] Completed routine');

    let run = this.routineRuns.find((r) => r.id === runID);
    assert(run);

    run = RoutineRunModule.set(run, { status: 'DONE' });
    await DB.genSetModel(RoutineRunModule, run);

    // Forward the info to the requesting worker / lifecycle.
    if (run.requestingWorkerRef) {
      const requestingWorkerID = run.requestingWorkerRef.refID;
      const requestingLC = this.lifecycles.find(
        (lc) => lc.worker.id === requestingWorkerID,
      );
      assert(requestingLC);
      const fromWorkerID = lifecycle.worker.id;
      requestingLC.runCompleted(
        fromWorkerID,
        routineID,
        run.id,
        run.localRunID,
        result,
      );
    }

    // Remote the completed run from the set of runs.
    const index = this.routineRuns.findIndex((r) => r.id === run?.id);
    assert(index >= 0);
    this.routineRuns.splice(index, 1);
  };
}
