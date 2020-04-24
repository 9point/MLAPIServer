const GRPCMLMessages = require('../static_codegen/mlservice_pb');

function createMessage(worker) {
  const status = GRPCMLMessages.Obj_Worker.Status[worker.status];
  if (typeof status !== 'number') {
    throw Error(`Invalid worker status: ${worker.status}`);
  }

  const message = new GRPCMLMessages.Obj_Worker();
  message.setId(worker.id);
  message.setCreatedAt(Math.floor(worker.createdAt.toDate().getTime() / 1000));
  message.setIsDeleted(worker.isDeleted);
  message.setProjectId(worker.projectRef.refID);
  message.setStatus(status);
  message.setUpdatedAt(Math.floor(worker.updatedAt.toDate().getTime() / 1000));
  return message;
}

module.exports = {
  createMessage,
};
