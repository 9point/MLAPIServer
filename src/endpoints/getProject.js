const DB = require('../db');
const GRPCUtils = require('../grpc-utils');
const Project = require('../models-DEPRECATED/Project');

async function getProject(call, callback) {
  console.log('GetProject: Calling');

  const { request } = call;
  const name = request.getName();

  const query = DB.createQuery(Project, (_) =>
    _.where('name', '==', name).where('isDeleted', '==', false),
  );

  const project = await DB.genRunQueryOne(query);

  if (!project) {
    callback(Error(`No project named ${name} was found.`));
    return;
  }

  const message = GRPCUtils.Project.createMessage(project);
  callback(null, message);
}

module.exports = getProject;
