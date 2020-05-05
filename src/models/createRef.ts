import { Ref } from './types';

export default function createRef<
  TType extends string,
  TRef extends Ref<TType>
>(type: TType, id: string): TRef {
  return {
    refID: id,
    refType: type,
    type: 'REF',
  } as TRef;
}
