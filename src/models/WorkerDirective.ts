import assert from 'assert';
import createModel from './createModel';

import { createRef as createWorkerRef, Ref as WorkerRef } from './Worker';
import {
  Model as _Model,
  ModelModule as _ModelModule,
  Ref as _Ref,
  ValidationResult,
} from './types';
import { v4 as uuidv4 } from 'uuid';

export const COLLECTION_NAME = 'WorkerDirectives';
export const MODEL_TYPE = 'WorkerDirective';

export type WorkerDirectiveType =
  | 'WORKER_TO_WORKER'
  | 'WORKER_TO_SERVICE'
  | 'SERVICE_TO_WORKER';

export interface Fields {
  directiveType: WorkerDirectiveType;
  fromWorkerRef: WorkerRef | null;
  payload: { [key: string]: any };
  payloadKey: string;
  toWorkerRef: WorkerRef | null;
}

export type Model = _Model<typeof MODEL_TYPE> & Fields;

export type Ref = _Ref<typeof MODEL_TYPE>;

export interface CreateFields {
  directiveType: WorkerDirectiveType;
  fromWorkerID: string | null;
  payload: { [key: string]: any };
  payloadKey: string;
  toWorkerID: string | null;
}

function create(fields: CreateFields): Model {
  return createModel(MODEL_TYPE, {
    directiveType: fields.directiveType,
    fromWorkerRef:
      fields.fromWorkerID === null
        ? null
        : createWorkerRef(fields.fromWorkerID),
    payload: fields.payload,
    payloadKey: fields.payloadKey,
    toWorkerRef:
      fields.toWorkerID === null ? null : createWorkerRef(fields.toWorkerID),
  });
}

export interface CreateFields$HeartbeatCheckPulse {
  toWorkerID: string;
}

export function createHeartbeatCheckPulse(
  fields: CreateFields$HeartbeatCheckPulse,
): Model {
  const { toWorkerID } = fields;

  return create({
    directiveType: 'SERVICE_TO_WORKER',
    fromWorkerID: null,
    payload: { id: uuidv4() },
    payloadKey: 'v1.heartbeat.check_pulse',
    toWorkerID,
  });
}

export interface CreateFields$InfoRequestStatus {
  toWorkerID: string;
}

export function createInfoRequestStatus(
  fields: CreateFields$InfoRequestStatus,
): Model {
  const { toWorkerID } = fields;

  return create({
    directiveType: 'SERVICE_TO_WORKER',
    fromWorkerID: null,
    payload: {},
    payloadKey: 'v1.info.check_status',
    toWorkerID,
  });
}

export interface CreateFields$RoutineRequestStart {
  arguments: { [key: string]: any };
  fromWorkerID: string | null;
  routineID: string;
  requestingWorkerLocalExecutionID: string | null;
  toWorkerID: string;
}

export function createRoutineRequestStart(
  fields: CreateFields$RoutineRequestStart,
): Model {
  const {
    arguments: _arguments,
    fromWorkerID,
    requestingWorkerLocalExecutionID,
    routineID,
    toWorkerID,
  } = fields;

  let directiveType: WorkerDirectiveType;
  if (!fromWorkerID) {
    // This directive was not initiated by a worker.
    assert(requestingWorkerLocalExecutionID === null);
    directiveType = 'SERVICE_TO_WORKER';
  } else {
    assert(requestingWorkerLocalExecutionID !== null);
    directiveType = 'WORKER_TO_WORKER';
  }

  return create({
    directiveType,
    fromWorkerID,
    payload: {
      arguments: _arguments,
      requestingWorkerLocalExecutionID,
      routineID,
    },
    payloadKey: 'v1.routine.request_start',
    toWorkerID,
  });
}

export interface CreateFields$RoutineStarting {
  fromWorkerID: string;
  requestingWorkerLocalExecutionID: string;
  routineID: string;
  toWorkerID: string;
}

export function createRoutineStarting(
  fields: CreateFields$RoutineStarting,
): Model {
  const {
    fromWorkerID,
    requestingWorkerLocalExecutionID,
    routineID,
    toWorkerID,
  } = fields;

  return create({
    directiveType: 'WORKER_TO_WORKER',
    fromWorkerID,
    payload: {
      requestingWorkerLocalExecutionID,
      routineID,
    },
    payloadKey: 'v1.routine.starting',
    toWorkerID,
  });
}

export interface CreateFields$RoutineCompleted {
  fromWorkerID: string;
  requestingWorkerLocalExecutionID: string;
  result: any;
  routineID: string;
  toWorkerID: string;
}

export function createRoutineCompleted(
  fields: CreateFields$RoutineCompleted,
): Model {
  const {
    fromWorkerID,
    requestingWorkerLocalExecutionID,
    result,
    routineID,
    toWorkerID,
  } = fields;

  return create({
    directiveType: 'WORKER_TO_WORKER',
    fromWorkerID,
    payload: {
      result,
      requestingWorkerLocalExecutionID,
      routineID,
    },
    payloadKey: 'v1.routine.completed',
    toWorkerID,
  });
}

export interface CreateFields$RoutineFailed {
  errorMessage: string;
  fromWorkerID: string;
  requestingWorkerLocalExecutionID: string;
  routineID: string;
  toWorkerID: string;
}

export function createRoutineFailed(fields: CreateFields$RoutineFailed): Model {
  const {
    errorMessage,
    fromWorkerID,
    requestingWorkerLocalExecutionID,
    routineID,
    toWorkerID,
  } = fields;

  return create({
    directiveType: 'WORKER_TO_WORKER',
    fromWorkerID,
    payload: {
      errorMessage,
      requestingWorkerLocalExecutionID,
      routineID,
    },
    payloadKey: 'v1.routine.failed',
    toWorkerID,
  });
}

export interface ModelModule
  extends _ModelModule<typeof MODEL_TYPE, Fields, Model> {
  create: typeof create;
  validate: typeof validate;
}

export function validate(model: Model): ValidationResult {
  return { isValid: true };
}

export default {
  COLLECTION_NAME,
  MODEL_TYPE,
  create,
  validate,
} as ModelModule;
