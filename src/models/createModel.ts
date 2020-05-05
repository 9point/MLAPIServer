import { Model } from './types';

import { v4 as uuidv4 } from 'uuid';

export default function createModel<TType extends string, TFields>(
  type: TType,
  fields: TFields,
): Model<TType> & TFields {
  const now = new Date();
  return {
    ...fields,
    createdAt: now,
    id: uuidv4(),
    isDeleted: false,
    modelType: type,
    type: 'MODEL',
    updatedAt: now,
  };
}
