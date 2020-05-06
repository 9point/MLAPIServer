const GRPCMLMessages = require('../static_codegen/mlservice_pb');

function createMessage(task) {
  const message = new GRPCMLMessages.Obj_Task();
  message.setId(task.id);
  message.setIsMutable(task.isMutable);
  message.setCreatedAt(Math.floor(task.createdAt.toDate().getTime() / 1000));
  message.setName(task.name);
  message.setProjectRefId(task.projectRef.refID);
  message.setUpdatedAt(Math.floor(task.updatedAt.toDate().getTime() / 1000));
  message.setVersion(task.version);
  return message;
}

module.exports = {
  createMessage,
};
