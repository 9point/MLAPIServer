const GRPCMLMessages = require('../static_codegen/mlservice_pb');

function createMessage(workflow) {
  const message = new GRPCMLMessages.Obj_Workflow();
  message.setId(workflow._id.toString());
  message.setCreatedAt(Math.floor(workflow.createdAt.getTime() / 1000));
  message.setIsDeleted(workflow.isDeleted);
  message.setName(workflow.name);
  message.setProjectRefId(workflow.projectRef.refID);
  message.setUpdatedAt(Math.floor(workflow.updatedAt.getTime() / 1000));
  return message;
}

module.exports = {
  createMessage,
};
