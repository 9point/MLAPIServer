import createModel from './createModel';
import createRef from './createRef';
import setModel from './setModel';
import semver from '../semver';

import {
  Model as _Model,
  ModelModule as _ModelModule,
  Ref as _Ref,
} from './types';
import { Ref as ProjectRef } from './Project';

export const COLLECTION_NAME = 'Tasks';
export const MODEL_TYPE = 'Task';

export interface Fields {
  isMutable: boolean;
  name: string;
  projectRef: ProjectRef;
  version: string;
}

export type Model = _Model<typeof MODEL_TYPE> & Fields;

export type Ref = _Ref<typeof MODEL_TYPE>;

export type ModelModule = _ModelModule<typeof MODEL_TYPE, Fields, Model>;

export interface TCreateFields {
  name: string;
  projectID: string;
  version: string;
}

export function create(fields: TCreateFields): Model {
  const sv = semver.parse(fields.version);

  return createModel(MODEL_TYPE, {
    isMutable: sv.dev,
    name: fields.name,
    projectRef: createRef('Project', fields.projectID),
    version: fields.version,
  });
}

export interface TSetFields {
  version: string;
}

export function set(model: Model, fields: TSetFields) {
  const fromSemver = semver.parse(model.version);
  const toSemver = semver.parse(fields.version);

  if (!semver.isValidTransition(fromSemver, toSemver)) {
    throw Error(
      `Invalid version transition: ${model.version} -> ${fields.version}`,
    );
  }

  return setModel(model, { ...fields, isMutable: toSemver.dev });
}

export default {
  COLLECTION_NAME,
  MODEL_TYPE,
  create,
  set,
} as ModelModule;
