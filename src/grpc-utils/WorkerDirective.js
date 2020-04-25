const GRPCMLMessages = require('../static_codegen/mlservice_pb');

function createMessage(workerDirective) {
  const directiveType =
    GRPCMLMessages.WorkerDirectiveType[workerDirective.directiveType];

  if (typeof directiveType !== 'number') {
    throw Error(`Unrecognized directive type: ${directiveType}`);
  }

  const message = new GRPCMLMessages.Obj_WorkerDirective();
  message.setCreatedAt(
    Math.floor(workerDirective.createdAt.toDate().getTime() / 1000),
  );
  message.setDirectiveType(directiveType);
  message.setId(workerDirective.id);
  message.setIsDeleted(workerDirective.isDeleted);
  message.setPayload(JSON.stringify(workerDirective.payload));
  message.setPayloadKey(workerDirective.payloadKey);
  message.setWorkerId(workerDirective.workerRef.refID);
  message.setUpdatedAt(
    Math.floor(workerDirective.updatedAt.toDate().getTime() / 1000),
  )
  return message;
}

module.exports = {
  createMessage,
};
