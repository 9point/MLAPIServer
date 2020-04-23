const GRPCMLMessages = require('../static_codegen/mlservice_pb');

function createMessage(worker) {
  const message = new GRPCMLMessages.Obj_Worker();
  message.setId(worker._id.toString());
  message.setCreatedAt(Math.floor(worker.createdAt.getTime() / 1000));
  message.setIsDeleted(worker.isDeleted);
  message.setProjectId(worker.projectRef.refID);
  message.setStatus(worker.status);
  return message;
}

module.exports = {
  createMessage,
};
