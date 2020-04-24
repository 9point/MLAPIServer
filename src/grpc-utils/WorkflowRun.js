const GRPCMLMessages = require('../static_codegen/mlservice_pb');

function createMessage(workflowRun) {
  const message = new GRPCMLMessages.Obj_WorkflowRun();
  message.setId(workflowRun.id);
  message.setCreatedAt(
    Math.floor(workflow.createdAt.toDate().getTime() / 1000),
  );
  message.setIsDeleted(workflowRun.isDeleted);
  message.setJobId(workflowRun.jobID);
  message.setWorkflowRunRefId(workflowRun.workflowRef.refID);
  message.setUpdatedAt(
    Math.floor(workflowRun.updatedAt.toDate().getTime() / 1000),
  );
  return message;
}

module.exports = {
  createMessage,
};
