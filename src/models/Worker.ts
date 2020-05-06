import createModel from './createModel';
import setModel from './setModel';

import { createRef as createProjectRef, Ref as ProjectRef } from './Project';
import {
  Model as _Model,
  ModelModule as _ModelModule,
  Ref as _Ref,
} from './types';

export const COLLECTION_NAME = 'Workers';
export const MODEL_TYPE = 'Worker';

export type WorkerStatus = 'INITIALIZING' | 'IDLE' | 'WORKING' | 'HANGING';

export interface Fields {
  projectRef: ProjectRef;
  status: WorkerStatus;
}

export type Model = _Model<typeof MODEL_TYPE> & Fields;

export type Ref = _Ref<typeof MODEL_TYPE>;

export type ModelModule = _ModelModule<typeof MODEL_TYPE, Fields, Model>;

export interface CreateFields {
  projectID: string;
  status?: WorkerStatus;
}

export function create(fields: CreateFields): Model {
  return createModel(MODEL_TYPE, {
    projectRef: createProjectRef(fields.projectID),
    status: fields.status || 'INITIALIZING',
  });
}

export function createRef(refID: string): Ref {
  return { type: 'REF', refID, refType: MODEL_TYPE };
}

export interface SetFields {
  status: WorkerStatus;
}

function set(model: Model, fields: SetFields): Model {
  return setModel(model, fields);
}

module.exports = {
  COLLECTION_NAME,
  MODEL_TYPE,
  create,
  createRef,
  set,
};
