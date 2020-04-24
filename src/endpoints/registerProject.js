const DB = require('../db');
const GRPCUtils = require('../grpc-utils');
const Project = require('../models/Project');

async function registerProject(call, callback) {
  console.log('Calling: RegisterProject');

  const { request } = call;
  const name = request.getName();
  const imageName = request.getImageName();

  const query = DB.createQuery(Project, (_) =>
    _.where('name', '==', name).where('isDeleted', '==', false),
  );

  let project = await DB.genRunQueryOne(query);

  if (project) {
    console.log(`Registering existing project: ${projectName}...`);
    // This project already exists. Check for any updates.
    project = await GRPCUtils.Project.genUpdate(project, request);
    callback(null, GRPCUtils.Project.createMessage(project));
    return;
  }

  console.log(`Registering new project: ${projectName}...`);

  project = Project.create({ imageName, name });
  await DB.genSetModel(Project, project);

  callback(null, GRPCUtils.Project.createMessage(project));
}

module.exports = registerProject;
