const GRPCMLMessages = require('../static_codegen/mlservice_pb');

function createMessage(workflow) {
  const message = new GRPCMLMessages.Obj_Workflow();
  message.setId(workflow.id);
  message.setCreatedAt(
    Math.floor(workflow.createdAt.toDate().getTime() / 1000),
  );
  message.setIsDeleted(workflow.isDeleted);
  message.setName(workflow.name);
  message.setProjectRefId(workflow.projectRef.refID);
  message.setUpdatedAt(
    Math.floor(workflow.updatedAt.toDate().getTime() / 1000),
  );
  return message;
}

module.exports = {
  createMessage,
};
