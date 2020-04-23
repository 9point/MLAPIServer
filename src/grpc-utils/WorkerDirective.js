const GRPCMLMessages = require('../static_codegen/mlservice_pb');

function createMessage(workerDirective) {
  const message = new GRPCMLMessages.Obj_WorkerDirective();
  message.setCreatedAt(Math.floor(workerDirective.createdAt.getTime() / 1000));
  message.setDirectiveType(workerDirective.directiveType);
  message.setId(workerDirective._id.toString());
  message.setIsDeleted(workerDirective.isDeleted);
  message.setPayload(workerDirective.payload);
  message.setPayloadKey(workerDirective.payloadKey);
  message.setWorkerId(workerDirective.workerRef.refID);
  return message;
}

module.exports = {
  createMessage,
};
