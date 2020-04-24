const Endpoints = require('./endpoints');
const FirebaseAdmin = require('firebase-admin');
const GRPCMLServices = require('./static_codegen/mlservice_grpc_pb');

const fs = require('fs');
const grpc = require('grpc');

console.log('Initializing firebase connection...');

const firebaseServiceAccount = fs.readFileSync(
  process.env.FIREBASE_SERVICE_ACCOUNT,
);

FirebaseAdmin.initializeApp(firebaseServiceAccount);

const port = process.env.PORT || '50051';

const server = new grpc.Server();
server.addService(GRPCMLServices.MLService, Endpoints);

server.bind(`localhost:${port}`, grpc.ServerCredentials.createInsecure());
server.start();

console.log(`Listening on port ${port}`);
