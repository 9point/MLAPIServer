import createModel from './createModel';
import setModel from './setModel';

import { createRef as createProjectRef, Ref as ProjectRef } from './Project';
import {
  Model as _Model,
  ModelModule as _ModelModule,
  Ref as _Ref,
  ValidationResult,
} from './types';

export const COLLECTION_NAME = 'Workers';
export const MODEL_TYPE = 'Worker';

export type WorkerStatus =
  | 'CLOSED'
  | 'HANGING'
  | 'IDLE'
  | 'INITIALIZING'
  | 'TERMINATING'
  | 'UNRESPONSIVE'
  | 'WORKING';

export interface Fields {
  projectRef: ProjectRef;
  routines: string[];
  status: WorkerStatus;
}

export type Model = _Model<typeof MODEL_TYPE> & Fields;

export type Ref = _Ref<typeof MODEL_TYPE>;

export interface CreateFields {
  projectID: string;
  routines: string[];
  status?: WorkerStatus;
}

export function create(fields: CreateFields): Model {
  return createModel(MODEL_TYPE, {
    projectRef: createProjectRef(fields.projectID),
    routines: fields.routines,
    status: fields.status || 'INITIALIZING',
  });
}

export function createRef(refID: string): Ref {
  return { type: 'REF', refID, refType: MODEL_TYPE };
}

export interface SetFields {
  status: WorkerStatus;
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
