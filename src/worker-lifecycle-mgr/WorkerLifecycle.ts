import * as DB from '../db';
import WorkerModule, { Model as Worker, WorkerStatus } from '../models/Worker';
import WorkerDirectiveModule, {
  createHeartbeatCheckPulse,
  createRoutineCompleted,
  createRoutineRequestStart,
  createRoutineStarting,
  Model as WorkerDirective,
} from '../models/WorkerDirective';
import WorkerDirectiveConnection from './WorkerDirectiveConnection';

import assert from 'assert';

import { ConnectionConfig } from './WorkerDirectiveConnection';
import {
  fromRoutine as routineIDFromRoutine,
  FullRoutineID,
  matches as matchesRoutineID,
  parse as parseRoutineID,
  parseFull as parseFullRoutineID,
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

// TODO: Better typing.
interface Listener {
  cb: (...param: any[]) => void;
  key: string;
}

interface RunInfo {
  routine: Task | Workflow;
  runID: string;
}

export default class WorkerLifecycle {
  private _project: Project;
  private _worker: Worker;
  private acceptableRoutineIDs: RoutineID[] = [];
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

  get acceptsWorkRequests(): boolean {
    return this._worker.acceptsWorkRequests;
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
      connection.onDirective(
        'v1.routine.completed',
        this.onReceivedRoutineCompleted,
      ),
      connection.onDirective(
        'v1.routine.request_start',
        this.onReceivedRoutineRequestStart,
      ),
      connection.onDirective(
        'v1.routine.starting',
        this.onReceivedRoutineStarting,
      ),
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
      this.acceptsWorkRequests &&
      this.acceptableRoutineIDs.some((_id) => matchesRoutineID(_id, id))
    );
  }

  public runRoutine(
    routine: Task | Workflow,
    args: { [key: string]: any },
    runID: string,
    parentRunID: string | null,
    localRunID: string,
    fromWorkerID: string | null,
  ) {
    console.log('[WorkerLifecycle] runRoutine');
    assert(this.directiveConnection, 'Expectin directive connection to exist.');

    const id = routineIDFromRoutine(routine, this.project);

    if (!this.canRunRoutine(id)) {
      const strID = routineIDToString(id);
      throw new UnacceptedRoutine(`Unable to run routine: ${strID}`);
    }

    if (!routine) {
      throw new Error(`No routine with id: ${routineIDToString(id)}`);
    }

    const fields = {
      arguments: args,
      fromWorkerID: fromWorkerID,
      localRunID,
      parentRunID,
      routineID: routineIDToString(id),
      runID,
      toWorkerID: this._worker.id,
    };

    const directive = createRoutineRequestStart(fields);

    this.directiveConnection.send(directive);
  }

  // ---------------------------------------------------------------------------
  // LISTENERS
  // ---------------------------------------------------------------------------

  // TODO: Better callback typing.
  public onStartRoutineRun(
    cb: (routineID: FullRoutineID, runID: string, localRunID: string) => void,
  ) {
    return this.addListener({ cb, key: 'startRoutineRun' });
  }

  public onRequestStartRoutine(
    cb: (
      routineID: FullRoutineID,
      localRunID: string,
      parentRunID: string,
      args: Object,
    ) => {},
  ): Subscription {
    return this.addListener({ cb, key: 'requestStartRoutine' });
  }

  // TODO: Better callback typing.
  public onCompleteRoutineRun(
    cb: (
      routineID: FullRoutineID,
      runID: string,
      localRunID: string,
      result: Object,
    ) => void,
  ) {
    return this.addListener({ cb, key: 'completeRoutineRun' });
  }

  public onCloseConnection(cb: () => void) {
    return this.addListener({ cb, key: 'closeConnection' });
  }

  // ---------------------------------------------------------------------------
  // MESSAGE FORWARDING
  // ---------------------------------------------------------------------------

  public runStarting(
    fromWorkerID: string,
    routineID: FullRoutineID,
    runID: string,
    localRunID: string,
  ) {
    assert(this.directiveConnection);

    const directive = createRoutineStarting({
      fromWorkerID,
      routineID: routineIDToString(routineID),
      localRunID,
      runID,
      toWorkerID: this.worker.id,
    });

    this.directiveConnection.send(directive);
  }

  public runCompleted(
    fromWorkerID: string,
    routineID: FullRoutineID,
    runID: string,
    localRunID: string,
    result: Object,
  ) {
    assert(this.directiveConnection);

    const directive = createRoutineCompleted({
      fromWorkerID,
      localRunID,
      result,
      routineID: routineIDToString(routineID),
      runID,
      toWorkerID: this.worker.id,
    });

    this.directiveConnection.send(directive);
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

  private sendEvent(key: string, ...args: any[]) {
    for (const listener of this.listeners) {
      if (listener.key === key) {
        listener.cb(...args);
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
    this.sendEvent('closeConnection');
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

  private onReceivedRoutineRequestStart = (directive: WorkerDirective) => {
    console.log('[WorkerLifecycle] Receiving routine request start');

    const { payload } = directive;

    const fullRoutineID = parseFullRoutineID(payload.routineID);

    const { arguments: args, localRunID, parentRunID } = payload;

    this.sendEvent(
      'requestStartRoutine',
      fullRoutineID,
      localRunID,
      parentRunID,
      args,
    );
  };

  private onReceivedRoutineStarting = (directive: WorkerDirective) => {
    console.log('[WorkerLifecycle] Receiving routine starting');

    const { payload } = directive;
    const routineID = parseFullRoutineID(payload.routineID);
    const runID = payload.runID;
    const localRunID = payload.localRunID;

    assert(runID);
    assert(localRunID);

    this.sendEvent('startRoutineRun', routineID, runID);
  };

  private onReceivedRoutineCompleted = (directive: WorkerDirective) => {
    console.log('[WorkerLifecycle] Receiving routine completed');

    const { payload } = directive;
    const routineID = parseFullRoutineID(payload.routineID);
    const localRunID = payload.localRunID;
    const runID = payload.runID;
    const result = payload.result;

    assert(runID);
    assert(localRunID);
    assert(result);

    this.sendEvent('completeRoutineRun', routineID, runID, localRunID, result);
  };
}

export class UnacceptedRoutine extends Error {}
