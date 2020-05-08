import createModel from './createModel';
import setModel from './setModel';

import { createRef as createWorkerRef, Ref as WorkerRef } from './Worker';
import { createRef as createWorkflowRef, Ref as WorkflowRef } from './Workflow';
import {
  Model as _Model,
  ModelModule as _ModelModule,
  Ref as _Ref,
  ValidationResult,
} from './types';

export const COLLECTION_NAME = 'WorkflowRuns';
export const MODEL_TYPE = 'WorkflowRun';

export type RunType = 'RUN_BY_WORKER';

export type RunStatus =
  | 'DONE'
  | 'FAILED'
  | 'INITIALIZING'
  | 'RUNNING'
  | 'UNKNOWN';

export interface Fields {
  requestingWorkerRef: WorkerRef | undefined;
  runningWorkerRef: WorkerRef | undefined;
  runType: RunType;
  status: RunStatus;
  workflowRef: WorkflowRef;
}

export type Model = _Model<typeof MODEL_TYPE> & Fields;

export type Ref = _Ref<typeof MODEL_TYPE>;

export interface CreateFields {
  requestingWorkerID: string | undefined;
  runningWorkerID: string | undefined;
  runType: RunType;
  workflowID: string;
}

export function create(fields: CreateFields): Model {
  return createModel(MODEL_TYPE, {
    requestingWorkerRef:
      fields.requestingWorkerID === undefined
        ? undefined
        : createWorkerRef(fields.requestingWorkerID),
    runningWorkerRef:
      fields.runningWorkerID === undefined
        ? undefined
        : createWorkerRef(fields.runningWorkerID),
    runType: fields.runType,
    status: 'INITIALIZING',
    workflowRef: createWorkflowRef(fields.workflowID),
  });
}

export function createRef(refID: string): Ref {
  return { type: 'REF', refID, refType: MODEL_TYPE };
}

export interface SetFields {
  status: RunStatus;
}

export function set(model: Model, fields: SetFields): Model {
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
