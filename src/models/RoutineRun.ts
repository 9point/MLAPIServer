import createModel from './createModel';
import setModel from './setModel';

import { createRef as createTaskRef, Ref as TaskRef } from './Task';
import { createRef as createWorkerRef, Ref as WorkerRef } from './Worker';
import { createRef as createWorkflowRef, Ref as WorkflowRef } from './Workflow';
import {
  Model as _Model,
  ModelModule as _ModelModule,
  Ref as _Ref,
  ValidationResult,
} from './types';

export const COLLECTION_NAME = 'RoutineRuns';
export const MODEL_TYPE = 'RoutineRun';

export type RunStatus =
  | 'DONE'
  | 'FAILED'
  | 'INITIALIZING'
  | 'RUNNING'
  | 'UNKNOWN';

export interface Fields {
  parentRunRef: Ref | null;
  requestingWorkerRef: WorkerRef | null;
  routineRef: TaskRef | WorkflowRef;
  runningWorkerRef: WorkerRef;
  status: RunStatus;
}

export type Model = _Model<typeof MODEL_TYPE> & Fields;

export type Ref = _Ref<typeof MODEL_TYPE>;

export interface CreateFields {
  parentRunID: string | null;
  requestingWorkerID: string | null;
  runningWorkerID: string;
  routineDBID: string;
}

export function create(fields: CreateFields): Model {
  return createModel(MODEL_TYPE, {
    requestingWorkerRef:
      fields.requestingWorkerID === null
        ? null
        : createWorkerRef(fields.requestingWorkerID),
    routineRef: createTaskRef(fields.routineDBID),
    runningWorkerRef: createWorkerRef(fields.runningWorkerID),
    status: 'INITIALIZING',
    parentRunRef:
      fields.parentRunID === null ? null : createRef(fields.parentRunID),
  });
}

export function createRef(refID: string): Ref {
  return { type: 'REF', refID, refType: MODEL_TYPE };
}

export interface SetFields {
  status: RunStatus;
}

export function set(model: Model, fields: SetFields) {
  return setModel(model, fields);
}

export function validate(model: Model): ValidationResult {
  return { isValid: true };
}

export interface ModelModule
  extends _ModelModule<typeof MODEL_TYPE, Fields, Model> {
  create: typeof create;
  createRef: typeof createRef;
  set: typeof set;
  validate: typeof validate;
}

export default {
  COLLECTION_NAME,
  MODEL_TYPE,
  create,
  createRef,
  set,
  validate,
} as ModelModule;
