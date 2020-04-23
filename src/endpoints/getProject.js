const GRPCUtils = require('../grpc-utils');
const Project = require('../models/Project');

async function getProject(call, callback) {
  console.log('GetProject: Calling');

  const { request } = call;
  const projectName = request.getName();

  const project = await Project.findOne({ name: projectName });

  if (!project) {
    callback(Error(`No project named ${projectName} was found.`));
    return;
  }

  const message = GRPCUtils.Project.createMessage(project);
  callback(null, message);
}

module.exports = getProject;