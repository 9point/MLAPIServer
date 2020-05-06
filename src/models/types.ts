export interface Model<TType extends string> {
  createdAt: Date;
  id: string;
  isDeleted: boolean;
  modelType: TType;
  type: 'MODEL';
  updatedAt: Date;
}

export interface Ref<TType extends string> {
  refID: string;
  refType: TType;
  type: 'REF';
}

export interface ModelModule<
  TType extends string,
  TFields extends Object,
  TModel extends Model<TType> & TFields
> {
  COLLECTION_NAME: string;
  MODEL_TYPE: TType;
  create: (fields: TFields) => TModel;
}
