const GRPCUtils = require('../grpc-utils');
const Project = require('../models/Project');

async function registerProject(call, callback) {
  console.log('Calling: RegisterProject');

  const { request } = call;
  const projectName = request.getName();
  const imageName = request.getImageName();

  let project = await Project.findOne({ isDeleted: false, name: projectName });

  if (project) {
    console.log(`Registering existing project: ${projectName}...`);
    // This project already exists. Check for any updates.
    project = await GRPCUtils.Project.genUpdate(project, request);
    callback(null, GRPCUtils.Project.createMessage(project));
    return;
  }

  console.log(`Registering new project: ${projectName}...`);

  const now = new Date();
  project = new Project({
    __modelType__: 'Project',
    __type__: 'Model',
    createdAt: now,
    imageName: imageName,
    isDeleted: false,
    name: projectName,
    updatedAt: now,
  });

  await project.save();

  callback(null, GRPCUtils.Project.createMessage(project));
}

module.exports = registerProject;
