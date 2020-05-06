import GRPCMLMessages from '../static_codegen/mlservice_pb';

import { Model as Workflow } from '../models/Workflow';

export function createMessage(workflow: Workflow) {
  // @ts-ignore
  const message = new GRPCMLMessages.Obj_Workflow();
  message.setId(workflow.id);
  message.setCreatedAt(Math.floor(workflow.createdAt.getTime() / 1000));
  message.setIsDeleted(workflow.isDeleted);
  message.setName(workflow.name);
  message.setProjectRefId(workflow.projectRef.refID);
  message.setUpdatedAt(Math.floor(workflow.updatedAt.getTime() / 1000));
  return message;
}
