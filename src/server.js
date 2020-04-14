const grpc = require('grpc');
const messages = require('./greeter-service/helloworld_pb');
const services = require('./greeter-service/helloworld_grpc_pb');

/**
 * Implements the SayHello RPC method.
 */
function sayHello(call, callback) {
  var reply = new messages.HelloReply();
  reply.setMessage('Hello ' + call.request.getName());
  callback(null, reply);
}

const port = process.env.PORT || '50051';

const server = new grpc.Server();
server.addService(services.GreeterService, { sayHello: sayHello });
server.bind(`0.0.0.0:${port}`, grpc.ServerCredentials.createInsecure());
server.start();
