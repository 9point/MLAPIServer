const GRPCMLMessages = require('./static_codegen/mlservice_pb');
const GRPCMLServices = require('./static_codegen/mlservice_grpc_pb');
const GRPCUtils = require('./grpc-utils');
const Project = require('./models/Project');

const grpc = require('grpc');

const { genConnect } = require('./models');

async function registerProject(call, callback) {
  console.log('Calling: RegisterProject');

  const { request } = call;
  const projectName = request.getName();
  const imageName = request.getImageName();

  let project = await Project.findOne({ name: projectName });

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

const port = process.env.PORT || '50051';

const server = new grpc.Server();
server.addService(GRPCMLServices.MLService, {
  registerProject: GRPCUtils.handleError(registerProject),
});

server.bind(`localhost:${port}`, grpc.ServerCredentials.createInsecure());
server.start();

console.log(`Listening on port ${port}`);

genConnect()
  .then(() => {
    console.log('mongo connected');
    // MLProject.find().then(console.log).catch(console.error);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
