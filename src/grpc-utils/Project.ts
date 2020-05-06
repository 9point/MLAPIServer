import * as GRPCMLMessages from '../static_codegen/mlservice_pb';

import { Message } from './types';
import { Model as Project } from '../models/Project';

export function createMessage(project: Project): Message {
  // @ts-ignore
  const message = new GRPCMLMessages.Obj_Project();

  message.setId(project.id);
  message.setCreatedAt(Math.floor(project.createdAt.getTime() / 1000));
  message.setIsDeleted(project.isDeleted);
  message.setName(project.name);
  message.setUpdatedAt(Math.floor(project.updatedAt.getTime() / 1000));
  return message;
}
