const DB = require('../db');
const GRPCUtils = require('../grpc-utils');
const Project = require('../models-DEPRECATED/Project');

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
    console.log(`Registering existing project: ${name}...`);

    // This project already exists. Check for any updates.
    if (project.imageName !== imageName) {
      project = Project.set(project, { imageName });
      await DB.genSetModel(Project, project);
    }

    callback(null, GRPCUtils.Project.createMessage(project));
    return;
  }

  console.log(`Registering new project: ${name}...`);

  project = Project.create({ imageName, name });
  await DB.genSetModel(Project, project);

  callback(null, GRPCUtils.Project.createMessage(project));
}

module.exports = registerProject;
