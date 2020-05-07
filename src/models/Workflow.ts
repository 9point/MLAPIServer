import createModel from './createModel';

import { createRef as createProjectRef, Ref as ProjectRef } from './Project';
import {
  Model as _Model,
  ModelModule as _ModelModule,
  Ref as _Ref,
} from './types';

export const COLLECTION_NAME = 'Workflows';
export const MODEL_TYPE = 'Workflow';

export interface Fields {
  name: string;
  projectRef: ProjectRef;
}

export type Model = _Model<typeof MODEL_TYPE> & Fields;

export type Ref = _Ref<typeof MODEL_TYPE>;

export type ModelModule = _ModelModule<typeof MODEL_TYPE, Fields, Model>;

interface CreateFields {
  name: string;
  projectID: string;
}

export function create(fields: CreateFields): Model {
  return createModel(MODEL_TYPE, {
    name: fields.name,
    projectRef: createProjectRef(fields.projectID),
  });
}

export function createRef(refID: string): Ref {
  return { type: 'REF', refID, refType: MODEL_TYPE };
}

export function validate(model: Model) {
  const rName = /^[a-zA-Z][a-zA-Z\d-_\.]+$/;
  if (!rName.test(model.name)) {
    const m =
      'Name must start with an alphabetical character and can only contain alphanumerical characters, -, ., or _';
    const error = Error(`Invalid ${MODEL_TYPE} name: ${model.name}. ${m}`);
    return { error, isValid: false };
  }
  return { isValid: true };
}

export default {
  COLLECTION_NAME,
  MODEL_TYPE,
  create,
  createRef,
  validate,
} as ModelModule;
