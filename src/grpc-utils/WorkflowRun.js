const GRPCMLMessages = require('../static_codegen/mlservice_pb');

function createMessage(workflowRun) {
  const message = new GRPCMLMessages.Obj_WorkflowRun();
  message.setId(workflowRun.id);
  message.setCreatedAt(
    Math.floor(workflowRun.createdAt.toDate().getTime() / 1000),
  );
  message.setIsDeleted(workflowRun.isDeleted);
  message.setUpdatedAt(
    Math.floor(workflowRun.updatedAt.toDate().getTime() / 1000),
  );
  message.setWorkflowId(workflowRun.workflowRef.refID);

  return message;
}

module.exports = {
  createMessage,
};
