import * as DB from '../db';
import WorkerModule, { Model as Worker, WorkerStatus } from '../models/Worker';
import WorkerDirectiveModule, {
  createHeartbeatCheckPulse,
  createRoutineRequestStart,
  Model as WorkerDirective,
} from '../models/WorkerDirective';
import WorkerDirectiveConnection from './WorkerDirectiveConnection';

import assert from 'assert';

import { ConnectionConfig } from './WorkerDirectiveConnection';
import {
  fromRoutine as routineIDFromRoutine,
  matches as matchesRoutineID,
  parse as parseRoutineID,
  RoutineID,
  toString as routineIDToString,
} from '../routine-id';
import { Model as Project } from '../models/Project';
import { Model as Task } from '../models/Task';
import { Model as Workflow } from '../models/Workflow';
import { Subscription } from '../types';

interface HeartbeatState {
  [id: string]: boolean;
}

interface Listener {
  cb: (param: any) => void;
  key: string;
}

export default class WorkerLifecycle {
  private _project: Project;
  private _worker: Worker;
  private acceptableRoutineIDs: RoutineID[] = [];
  private activeRoutines: Array<Task | Workflow> = [];
  private directiveConnection: WorkerDirectiveConnection | null = null;
  private directiveConnectionSubscriptions: Subscription[] = [];
  private heartbeatState: HeartbeatState | null = null;
  private isConfigured: boolean = false;
  private listeners: Listener[] = [];

  constructor(worker: Worker, project: Project) {
    this._project = project;
    this._worker = worker;
    this.acceptableRoutineIDs = worker.routines.map((str) =>
      parseRoutineID(str),
    );
  }

  // ---------------------------------------------------------------------------
  // GETTERS
  // ---------------------------------------------------------------------------

  get project() {
    return this._project;
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

  // ---------------------------------------------------------------------------
  // SETUP
  // ---------------------------------------------------------------------------

  public configure() {
    console.log('[WorkerLifecycle] Configuring...');
    assert(!this.isConfigured);
    this.isConfigured = true;
  }

  cleanup() {
    console.log('[WorkerLifecycle] Cleaning up...');

    this.directiveConnectionSubscriptions.forEach((s) => s.stop());
    this.directiveConnectionSubscriptions = [];
    this.listeners = [];

    this.directiveConnection && this.directiveConnection.stop();
  }

  startDirectiveConnection(
    config: ConnectionConfig,
  ): WorkerDirectiveConnection {
    console.log('[WorkerLifecycle] Starting connection...');

    assert(config.workerID === this.worker.id);

    if (this.directiveConnection) {
      this.directiveConnection.stop();
      this.directiveConnection = null;
      this.directiveConnectionSubscriptions.forEach((s) => s.stop());
      this.directiveConnectionSubscriptions = [];
    }

    const connection = new WorkerDirectiveConnection(this.worker);
    connection.configure(config);

    this.directiveConnection = connection;

    this.directiveConnectionSubscriptions.push(
      connection.onDirective('v1.heartbeat.give_pulse', this.onHeartbeatPulse),
      connection.onDirective('v1.log', this.onLog),
      connection.onDirective('v1.routine.completed', this.onTaskCompleted),
      connection.onDirective('v1.routine.starting', this.onTaskStarting),
      connection.onClose(this.onCloseDirectiveConnection),
      this.createHeartbeatState(),
      this.startHeartbeat(),
    );

    return connection;
  }

  // ---------------------------------------------------------------------------
  // PUBLIC METHODS
  // ---------------------------------------------------------------------------

  public canRunRoutine(id: RoutineID): boolean {
    return (
      this.activeRoutines.length === 0 &&
      this.acceptableRoutineIDs.some((_id) => matchesRoutineID(_id, id))
    );
  }

  public runRoutine(
    routine: Task | Workflow,
    args: { [key: string]: any },
    fromWorkerID: string | null = null,
    requestingWorkerLocalExecutionID: string | null = null,
  ) {
    // TODO: For now, only 1 active routine per worker.
    assert(this.activeRoutines.length === 0);
    assert(this.status === 'IDLE');
    assert(this.directiveConnection);

    const id = routineIDFromRoutine(routine, this.project);

    if (!this.canRunRoutine(id)) {
      throw new UnacceptedRoutine();
    }

    if (!routine) {
      throw new Error(`No routine with id: ${routineIDToString(id)}`);
    }

    const fields = {
      arguments: args,
      fromWorkerID: fromWorkerID,
      routineID: routineIDToString(id),
      requestingWorkerLocalExecutionID,
      toWorkerID: this._worker.id,
    };

    const directive = createRoutineRequestStart(fields);

    this.directiveConnection.send(directive);
    this.activeRoutines.push(routine);
  }

  // ---------------------------------------------------------------------------
  // LISTENERS
  // ---------------------------------------------------------------------------

  // TODO: Better callback typing.
  public onStartRoutineRun(cb: (payload: any) => void) {
    return this.addListener({ cb, key: 'taskRunStart' });
  }

  // TODO: Better callback typing.
  public onCompleteRoutineRun(cb: (payload: any) => void) {
    return this.addListener({ cb, key: 'taskRunComplete' });
  }

  public onCloseConnection(cb: () => void) {
    return this.addListener({ cb, key: 'connectionClose' });
  }

  // ---------------------------------------------------------------------------
  // PRIVATE HELPERS
  // ---------------------------------------------------------------------------

  private async setWorkerStatus(status: WorkerStatus) {
    if (status === this.status) {
      return;
    }

    console.log(`[WorkerLifecycle] Setting status to: ${status}`);
    this._worker = WorkerModule.set(this._worker, { status });
    await DB.genSetModel(WorkerModule, this._worker);
  }

  private addListener(listener: Listener) {
    this.listeners.push(listener);

    const stop = () => {
      const index = this.listeners.indexOf(listener);
      if (index < 0) {
        return;
      }
      this.listeners.splice(index, 1);
    };
    return { stop };
  }

  private sendEvent(key: string, payload?: any) {
    for (const listener of this.listeners) {
      if (listener.key === key) {
        listener.cb(payload);
      }
    }
  }

  // ---------------------------------------------------------------------------
  // HEARTBEAT MANAGEMENT
  // ---------------------------------------------------------------------------

  private startHeartbeat() {
    assert(
      this.heartbeatState,
      'Must initialize heartbeat state before starting heartbeat.',
    );

    assert(
      this.directiveConnection,
      'Must establish connection before starting heartbeat.',
    );

    const HEARTBEAT_INTERVAL_MS = 60000;

    const heartbeat = async () => {
      if (!this.directiveConnection || !this.heartbeatState) {
        // If for any reason, the connection has been closed and the heartbeat
        // has not yet been cleaned up, need to make sure not to execute
        // heartbeat directive.
        return;
      }

      const isUnresponsive = Object.keys(this.heartbeatState).length > 0;

      if (isUnresponsive) {
        this.setWorkerStatus('UNRESPONSIVE');
      }

      // Send a pulse and record the id of the pulse in the state.

      const directive = createHeartbeatCheckPulse({
        toWorkerID: this._worker.id,
      });

      await DB.genSetModel(WorkerDirectiveModule, directive);
      this.directiveConnection.send(directive);
      this.heartbeatState[directive.payload.id] = true;
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

  private createHeartbeatState() {
    this.heartbeatState = {};

    const stop = () => {
      this.heartbeatState = null;
    };

    return { stop };
  }

  // ---------------------------------------------------------------------------
  // CALLBACKS
  // ---------------------------------------------------------------------------

  private onCloseDirectiveConnection = () => {
    this.sendEvent('connectionClose');
  };

  // ---------------------------------------------------------------------------
  // DIRECTIVE ROUTING
  // ---------------------------------------------------------------------------

  private onLog = (directive: WorkerDirective) => {
    console.log('[WorkerLifecycle] Received log.');
  };

  private onHeartbeatPulse = (directive: WorkerDirective) => {
    if (!this.heartbeatState) {
      // TODO: Add warning.

      // Could be that there is a delay between when the connection is
      // property closed and when the heartbeat state is cleaned up. Should
      // guard against this issue.
      return;
    }

    // TODO: Add proper type checking and error handling for the payload.
    const { status } = directive.payload;
    this.heartbeatState = {};
    this.setWorkerStatus(status);
  };

  private onTaskStarting = (directive: WorkerDirective) => {
    // TODO: Assert this is the same routine that is running.
    assert(this.activeRoutines.length > 0);

    const routine = this.activeRoutines[0];
    this.sendEvent('taskRunStart', { routine });
  };

  private onTaskCompleted = (directive: WorkerDirective) => {
    // TODO: Assert this is the same routine that is running.
    assert(this.activeRoutines.length > 0);

    const routine = this.activeRoutines[0];
    this.activeRoutines.splice(this.activeRoutines.indexOf(routine), 1);

    this.sendEvent('taskRunComplete', { routine });
  };
}

export class UnacceptedRoutine extends Error {}
