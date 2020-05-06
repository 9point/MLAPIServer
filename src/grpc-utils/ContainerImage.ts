import GRPCMLMessages from '../static_codegen/mlservice_pb';

import { Message } from './types';
import { Model as ContainerImage } from '../models/ContainerImage';

export function createMessage(containerImage: ContainerImage): Message {
  const taskIDs = containerImage.taskRefs.map((r) => r.refID).join('|');
  const workflowIDs = containerImage.workflowRefs.map((r) => r.refID).join('|');

  // @ts-ignore
  const message = new GRPCMLMessages.Obj_ContainerImage();

  message.setId(containerImage.id);
  message.setCreatedAt(Math.floor(containerImage.createdAt.getTime() / 1000));
  message.setIsDeleted(containerImage.isDeleted);
  message.setName(containerImage.name);
  message.setProjectId(containerImage.projectRef.refID);
  message.setTaskIds(taskIDs);
  message.setWorkflowIds(workflowIDs);
  message.setUpdatedAt(Math.floor(containerImage.updatedAt.getTime() / 1000));

  return message;
}
