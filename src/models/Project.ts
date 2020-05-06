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

export function set(model: Model, fields: Partial<Fields>) {
  return setModel(model, fields);
}

export default {
  COLLECTION_NAME,
  MODEL_TYPE,
  create,
  set,
} as ModelModule;
