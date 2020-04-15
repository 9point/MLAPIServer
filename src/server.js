const grpc = require('grpc');
const helloWorldMessages = require('./static_codegen/helloworld_pb');
const helloWorldServices = require('./static_codegen/helloworld_grpc_pb');

/**
 * Implements the SayHello RPC method.
 */
function sayHello(call, callback) {
  var reply = new helloWorldMessages.HelloReply();
  reply.setMessage('Hello ' + call.request.getName());
  callback(null, reply);
}

const port = process.env.PORT || '50051';

const server = new grpc.Server();
server.addService(helloWorldServices.GreeterService, { sayHello: sayHello });
server.bind(`0.0.0.0:${port}`, grpc.ServerCredentials.createInsecure());
server.start();

console.log(`Listening on port ${port}`);
