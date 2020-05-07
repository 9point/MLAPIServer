import createModel from './createModel';

import {
  Model as _Model,
  ModelModule as _ModelModule,
  Ref as _Ref,
  ValidationResult,
} from './types';

export const COLLECTION_NAME = 'Projects';
export const MODEL_TYPE = 'Project';

export interface Fields {
  name: string;
}

export type Model = _Model<typeof MODEL_TYPE> & Fields;

export type Ref = _Ref<typeof MODEL_TYPE>;

export function create(fields: Fields): Model {
  return createModel(MODEL_TYPE, fields);
}

export function createRef(refID: string): Ref {
  return { refID, refType: MODEL_TYPE, type: 'REF' };
}

export function validate(model: Model): ValidationResult {
  const rName = /^[a-zA-Z][a-zA-Z\d-_]+$/;
  if (!rName.test(model.name)) {
    const m =
      'Name must start with an alphabetical character and can only contain alphanumerical characters, -, or _';
    const error = Error(`Invalid ${MODEL_TYPE} name: ${model.name}. ${m}`);
    return { error, isValid: false };
  }
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
