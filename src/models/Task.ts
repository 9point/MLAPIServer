import createModel from './createModel';
import setModel from './setModel';
import semver from '../semver';

import { createRef as createProjectRef, Ref as ProjectRef } from './Project';
import {
  Model as _Model,
  ModelModule as _ModelModule,
  Ref as _Ref,
} from './types';

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

export interface CreateFields {
  name: string;
  projectID: string;
  version: string;
}

export function create(fields: CreateFields): Model {
  const sv = semver.parse(fields.version);

  return createModel(MODEL_TYPE, {
    isMutable: sv.dev,
    name: fields.name,
    projectRef: createProjectRef(fields.projectID),
    version: fields.version,
  });
}

export function createRef(refID: string): Ref {
  return { type: 'REF', refID, refType: MODEL_TYPE };
}

export interface SetFields {
  version: string;
}

export function set(model: Model, fields: SetFields) {
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
  createRef,
  set,
} as ModelModule;
