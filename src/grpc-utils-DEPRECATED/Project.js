const GRPCMLMessages = require('../static_codegen/mlservice_pb');

function createMessage(project) {
  const message = new GRPCMLMessages.Obj_Project();
  message.setId(project.id);
  message.setCreatedAt(Math.floor(project.createdAt.toDate().getTime() / 1000));
  message.setIsDeleted(project.isDeleted);
  message.setImageName(project.imageName);
  message.setName(project.name);
  message.setUpdatedAt(Math.floor(project.updatedAt.toDate().getTime() / 1000));
  return message;
}

module.exports = {
  createMessage,
};
