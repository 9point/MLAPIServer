const Endpoints = require('./endpoints');
const GRPCMLServices = require('./static_codegen/mlservice_grpc_pb');

const grpc = require('grpc');

const { genConnect } = require('./models');

const port = process.env.PORT || '50051';

const server = new grpc.Server();
server.addService(GRPCMLServices.MLService, Endpoints);

server.bind(`localhost:${port}`, grpc.ServerCredentials.createInsecure());
server.start();

console.log(`Listening on port ${port}`);

genConnect()
  .then(() => {
    console.log('mongo connected');
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
