const GRPCMLMessages = require('../static_codegen/mlservice_pb');

async function genUpdate(project, request) {
  let needsUpdate = false;

  const projectName = request.getName();
  const imageName = request.getImageName();

  if (project.name !== projectName) {
    project.name = projectName;
    needsUpdate = true;
  }

  if (project.imageName !== imageName) {
    project.imageName = imageName;
    needsUpdate = true;
  }

  if (needsUpdate) {
    const now = new Date();
    project.updatedAt = now;
    await project.save();
  }

  return project;
}

function createMessage(project) {
  const message = new GRPCMLMessages.Obj_Project();
  message.setId(project._id.toString());
  message.setCreatedAt(Math.floor(project.createdAt.getTime() / 1000));
  message.setIsDeleted(project.isDeleted);
  message.setImageName(project.imageName);
  message.setName(project.name);
  message.setUpdatedAt(Math.floor(project.updatedAt.getTime() / 1000));
  return message;
}

module.exports = {
  createMessage,
  genUpdate,
};
