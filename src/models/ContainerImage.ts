import createModel from './createModel';
import setModel from './setModel';

import { createRef as createProjectRef, Ref as ProjectRef } from './Project';
import { createRef as createTaskRef, Ref as TaskRef } from './Task';
import { createRef as createWorkflowRef, Ref as WorkflowRef } from './Workflow';
import {
  Model as _Model,
  ModelModule as _ModelModule,
  Ref as _Ref,
  ValidationResult,
} from './types';

export const COLLECTION_NAME = 'ContainerImages';
export const MODEL_TYPE = 'ContainerImage';

export interface Fields {
  name: string;
  projectRef: ProjectRef;
  protocol: string;
  taskRefs: TaskRef[];
  workflowRefs: WorkflowRef[];
}

export type Model = _Model<typeof MODEL_TYPE> & Fields;

export type Ref = _Ref<typeof MODEL_TYPE>;

export interface CreateFields {
  name: string;
  projectID: string;
  protocol: string;
  taskIDs: string[];
  workflowIDs: string[];
}

export function create(fields: CreateFields): Model {
  return createModel(MODEL_TYPE, {
    name: fields.name,
    projectRef: createProjectRef(fields.projectID),
    protocol: fields.protocol,
    taskRefs: fields.taskIDs.map((id) => createTaskRef(id)),
    workflowRefs: fields.workflowIDs.map((id) => createWorkflowRef(id)),
  });
}

export function createRef(refID: string): Ref {
  return { type: 'REF', refID, refType: MODEL_TYPE };
}

export function validate(model: Model): ValidationResult {
  return { isValid: true };
}

export interface ModelModule
  extends _ModelModule<typeof MODEL_TYPE, Fields, Model> {
  create: typeof create;
  createRef: typeof createRef;
  validate: typeof validate;
}

export default {
  COLLECTION_NAME,
  MODEL_TYPE,
  create,
  createRef,
  validate,
};
