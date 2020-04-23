const GRPCMLMessages = require('../static_codegen/mlservice_pb');

function createMessage(workflowRun) {
  const message = new GRPCMLMessages.Obj_WorkflowRun();
  message.setId(workflowRun._id.toString());
  message.setCreatedAt(Math.floor(workflow.createdAt.getTime() / 1000));
  message.setIsDeleted(workflowRun.isDeleted);
  message.setJobId(workflowRun.jobID);
  message.setWorkflowRunRefId(workflowRun.workflowRef.refID);
  message.setUpdatedAt(Math.floor(workflowRun.updatedAt.getTime() / 1000));
  return message;
}

module.exports = {
  createMessage,
};
