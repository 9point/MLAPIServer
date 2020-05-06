import createModel from './createModel';
import setModel from './setModel';

import {
  Model as _Model,
  ModelModule as _ModelModule,
  Ref as _Ref,
} from './types';

export const COLLECTION_NAME = 'Projects';
export const MODEL_TYPE = 'Project';

export interface Fields {
  imageName: string;
  name: string;
}

export type Model = _Model<typeof MODEL_TYPE> & Fields;

export type Ref = _Ref<typeof MODEL_TYPE>;

export type ModelModule = _ModelModule<typeof MODEL_TYPE, Fields, Model>;

export function create(fields: Fields): Model {
  return createModel(MODEL_TYPE, fields);
}

export function createRef(refID: string): Ref {
  return { refID, refType: MODEL_TYPE, type: 'REF' };
}

export function set(model: Model, fields: Partial<Fields>) {
  return setModel(model, fields);
}

export function validate(model: Model) {
  const rName = /^[a-zA-Z][a-zA-Z\d-_]+$/;
  if (!rName.test(model.name)) {
    const m =
      'Name must start with an alphabetical character and can only contain alphanumerical characters, -, or _';
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
  set,
  validate,
} as ModelModule;
