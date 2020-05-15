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

export interface CreateFields$RoutineRequestStart {
  arguments: { [key: string]: any };
  fromWorkerID: string | null;
  localRunID: string;
  parentRunID: string | null;
  routineID: string;
  runID: string | null;
  toWorkerID: string;
}

export function createRoutineRequestStart(
  fields: CreateFields$RoutineRequestStart,
): Model {
  const {
    arguments: _arguments,
    fromWorkerID,
    localRunID,
    parentRunID,
    routineID,
    runID,
    toWorkerID,
  } = fields;

  let directiveType: WorkerDirectiveType;
  if (!fromWorkerID) {
    directiveType = 'SERVICE_TO_WORKER';
  } else {
    directiveType = 'WORKER_TO_WORKER';
  }

  return create({
    directiveType,
    fromWorkerID,
    payload: {
      arguments: _arguments,
      localRunID,
      parentRunID,
      routineID,
      runID,
    },
    payloadKey: 'v1.routine.request_start',
    toWorkerID,
  });
}

export interface CreateFields$RoutineStarting {
  fromWorkerID: string;
  routineID: string;
  localRunID: string;
  runID: string;
  toWorkerID: string;
}

export function createRoutineStarting(
  fields: CreateFields$RoutineStarting,
): Model {
  const { fromWorkerID, localRunID, routineID, runID, toWorkerID } = fields;

  return create({
    directiveType: 'WORKER_TO_WORKER',
    fromWorkerID,
    payload: {
      localRunID,
      routineID,
      runID,
    },
    payloadKey: 'v1.routine.starting',
    toWorkerID,
  });
}

export interface CreateFields$RoutineCompleted {
  fromWorkerID: string;
  localRunID: string;
  result: any;
  routineID: string;
  runID: string;
  toWorkerID: string;
}

export function createRoutineCompleted(
  fields: CreateFields$RoutineCompleted,
): Model {
  const {
    fromWorkerID,
    localRunID,
    result,
    routineID,
    runID,
    toWorkerID,
  } = fields;

  return create({
    directiveType: 'WORKER_TO_WORKER',
    fromWorkerID,
    payload: {
      localRunID,
      result,
      routineID,
      runID,
    },
    payloadKey: 'v1.routine.completed',
    toWorkerID,
  });
}

export interface CreateFields$RoutineFailed {
  errorMessage: string;
  fromWorkerID: string;
  localRunID: string;
  routineID: string;
  runID: string;
  toWorkerID: string;
}

export function createRoutineFailed(fields: CreateFields$RoutineFailed): Model {
  const {
    errorMessage,
    fromWorkerID,
    localRunID,
    routineID,
    runID,
    toWorkerID,
  } = fields;

  return create({
    directiveType: 'WORKER_TO_WORKER',
    fromWorkerID,
    payload: {
      errorMessage,
      localRunID,
      routineID,
      runID,
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
