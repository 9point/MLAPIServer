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
