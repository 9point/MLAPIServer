import FirebaseAdmin from 'firebase-admin';

import assert from 'assert';

import { Model, ModelModule } from '../models/types';
import { Subscription } from '../types';

export type Raw = FirebaseFirestore.DocumentData;

export type Query = FirebaseFirestore.Query<Raw>;

export type QueryCallback = (collection: Collection) => Query;

export type QueryListener<TType extends string, TModel extends Model<TType>> = (
  change: Change<TType, TModel>,
) => void;

export type Collection = FirebaseFirestore.CollectionReference<Raw>;

export interface Change<TType extends string, TModel extends Model<TType>> {
  [changeType: string]: TModel[];
}

// TODO: Should be using iots: https://github.com/gcanti/io-ts
export function transformFromModel<
  TType extends string,
  TModel extends Model<TType>
>(model: TModel): Raw {
  const obj: { [key: string]: any } = {};

  for (const key of Object.keys(model)) {
    // @ts-ignore
    let val = model[key];
    if (val instanceof Date) {
      val = FirebaseAdmin.firestore.Timestamp.fromDate(val);
    }
    obj[key] = val;
  }

  return obj;
}

// TODO: Should be using iots: https://github.com/gcanti/io-ts
export function transformToModel<
  TType extends string,
  TModel extends Model<TType>
>(obj: Raw): TModel {
  const model = {};

  for (const key of Object.values(obj)) {
    let val = obj[key];
    if (val instanceof FirebaseAdmin.firestore.Timestamp) {
      val = val.toDate();
    }
    // @ts-ignore
    model[key] = val;
  }

  // @ts-ignore
  return model;
}

export async function genFetchModel<
  TType extends string,
  TModel extends Model<TType>
>(module: ModelModule<TType, any, TModel>, id: string): Promise<TModel | null> {
  const ref = FirebaseAdmin.firestore()
    .collection(module.COLLECTION_NAME)
    .doc(id);

  const doc = await ref.get();

  if (!doc.exists) {
    return null;
  }

  const data = doc.data();
  assert(data);
  return transformToModel<TType, TModel>(data);
}

async function genSetModel<TType extends string, TModel extends Model<TType>>(
  module: ModelModule<TType, any, TModel>,
  model: TModel,
): Promise<TModel> {
  const validationResult = module.validate(model);
  if (!validationResult.isValid) {
    throw validationResult.error;
  }

  const ref = FirebaseAdmin.firestore()
    .collection(module.COLLECTION_NAME)
    .doc(model.id);

  const data = transformFromModel<TType, TModel>(model);
  await ref.set(data);

  return model;
}

async function genDeleteModel<
  TType extends string,
  TModel extends Model<TType>
>(module: ModelModule<TType, any, TModel>, model: TModel): Promise<void> {
  const newModel = { ...model, isDeleted: true };
  await genSetModel(module, newModel);
}

function createQuery<TType extends string, TModel extends Model<TType>>(
  module: ModelModule<TType, any, TModel>,
  cb: QueryCallback,
): Query {
  return cb(FirebaseAdmin.firestore().collection(module.COLLECTION_NAME));
}

async function genRunQuery<TType extends string, TModel extends Model<TType>>(
  query: Query,
): Promise<TModel[]> {
  const snapshot = await query.get();
  const models: TModel[] = [];

  snapshot.forEach((doc) => {
    if (doc.exists) {
      const data = doc.data();
      assert(data);
      const model = transformToModel<TType, TModel>(data);
      models.push(model);
    }
  });

  return models;
}

async function genRunQueryOne<
  TType extends string,
  TModel extends Model<TType>
>(query: Query): Promise<TModel | null> {
  const models = await genRunQuery<TType, TModel>(query);
  return models[0] || null;
}

function listenQuery<TType extends string, TModel extends Model<TType>>(
  query: Query,
  cb: QueryListener<TType, TModel>,
): Subscription {
  const stop = query.onSnapshot((snapshot) => {
    const changePartitions: Change<TType, TModel> = {};
    snapshot.docChanges().forEach((change) => {
      const changeType = change.type;
      if (!changePartitions[changeType]) {
        changePartitions[changeType] = [];
      }

      const model = transformToModel<TType, TModel>(change.doc.data());
      changePartitions[changeType].push(model);
    });

    cb(changePartitions);
  });

  return { stop };
}

module.exports = {
  createQuery,
  genDeleteModel,
  genFetchModel,
  genRunQuery,
  genRunQueryOne,
  genSetModel,
  listenQuery,
};
