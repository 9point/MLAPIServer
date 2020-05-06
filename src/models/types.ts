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

export interface ValidationResult$IsValid {
  isValid: true;
}

export interface ValidationResult$IsNotValid {
  error: Error;
  isValid: false;
}

export type ValidationResult =
  | ValidationResult$IsValid
  | ValidationResult$IsNotValid;

export interface ModelModule<
  TType extends string,
  TFields extends Object,
  TModel extends Model<TType> & TFields
> {
  COLLECTION_NAME: string;
  MODEL_TYPE: TType;
  create: (fields: any) => TModel;
  createRef: (refID: string) => Ref<TType>;
  validate: (model: TModel) => ValidationResult;
}
