import GRPCMLMessages from '../static_codegen/mlservice_pb';

import { Message } from './types';
import { Model as Task } from '../models/Task';

export function createMessage(task: Task): Message {
  // @ts-ignore
  const message = new GRPCMLMessages.Obj_Task();

  message.setId(task.id);
  message.setIsMutable(task.isMutable);
  message.setCreatedAt(Math.floor(task.createdAt.getTime() / 1000));
  message.setName(task.name);
  message.setProjectRefId(task.projectRef.refID);
  message.setUpdatedAt(Math.floor(task.updatedAt.getTime() / 1000));
  message.setVersion(task.version);

  return message;
}
