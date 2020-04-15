const GRPCMLMessages = require('./static_codegen/mlservice_pb');
const GRPCMLServices = require('./static_codegen/mlservice_grpc_pb');
const MLProject = require('./models/MLProject');

const grpc = require('grpc');

const { genConnect } = require('./models');

/*
 * GRPC Endpoints
 */

function getProjects(call) {
  MLProject.find()
    .then((projects) => {
      if (projects.length === 0) {
        call.end();
        return;
      }

      for (const project of projects) {
        const message = new GRPCMLMessages.Obj_MLProject();
        message.setId(project._id.toString());
        message.setCreatedat(project.createdAt.getTime() / 1000);
        message.setUpdatedat(project.updatedAt.getTime() / 1000);
        message.setName(project.name);
        message.setIsdeleted(project.isDeleted);
        message.setImagename(project.imageName);

        call.write(message);
      }
    })
    .catch((error) => {
      console.error(error);
      call.end();
    });
}

const port = process.env.PORT || '50051';

const server = new grpc.Server();
server.addService(GRPCMLServices.MLServiceService, {
  getProjects: getProjects,
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
