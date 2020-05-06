import createModel from './createModel';

import { createRef as createWorkflowRef, Ref as WorkflowRef } from './Workflow';
import {
  Model as _Model,
  ModelModule as _ModelModule,
  Ref as _Ref,
} from './types';

export const COLLECTION_NAME = 'WorkflowRuns';
export const MODEL_TYPE = 'WorkflowRun';

export interface Fields {
  workflowRef: WorkflowRef;
}

export type Model = _Model<typeof MODEL_TYPE> & Fields;

export type Ref = _Ref<typeof MODEL_TYPE>;

export type ModelModule = _ModelModule<typeof MODEL_TYPE, Fields, Model>;

export interface CreateFields {
  workflowID: string;
}

export function create(fields: CreateFields): Model {
  return createModel(MODEL_TYPE, {
    workflowRef: createWorkflowRef(fields.workflowID),
  });
}

export function createRef(refID: string): Ref {
  return { type: 'REF', refID, refType: MODEL_TYPE };
}

export function validate(model: Model) {
  return { isValid: true };
}

export default {
  COLLECTION_NAME,
  MODEL_TYPE,
  create,
  createRef,
  validate,
} as ModelModule;
