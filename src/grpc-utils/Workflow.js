const GRPCMLMessages = require('../static_codegen/mlservice_pb');

const nullthrows = require('nullthrows');

function createMessage(workflow, tasks) {
  const taskNames = workflow.taskRefs.map((ref) => {
    const task = nullthrows(tasks.find((t) => t.id === ref.refID));
    return `${task.name}:${task.version}`;
  });

  const message = new GRPCMLMessages.Obj_Workflow();
  message.setId(workflow.id);
  message.setCreatedAt(
    Math.floor(workflow.createdAt.toDate().getTime() / 1000),
  );
  message.setIsDeleted(workflow.isDeleted);
  message.setName(workflow.name);
  message.setProjectRefId(workflow.projectRef.refID);
  message.setTaskNames(taskNames.join('|'));
  message.setUpdatedAt(
    Math.floor(workflow.updatedAt.toDate().getTime() / 1000),
  );
  return message;
}

module.exports = {
  createMessage,
};
