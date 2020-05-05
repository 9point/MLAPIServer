import assert from 'assert';

import { Model } from './types';

export default function setModel<
  TType extends string,
  TFields extends Object,
  TModel extends Model<TType> & TFields
>(model: TModel, fields: Partial<TFields>): TModel {
  assert(
    Object.keys(fields).length > 0,
    'Cannot set model with no new fields.',
  );

  const now = new Date();

  return {
    ...model,
    ...fields,
    updatedAt: now,
  };
}
