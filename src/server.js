const Endpoints = require('./endpoints');
const FirebaseAdmin = require('firebase-admin');
const GRPCMLServices = require('./static_codegen/mlservice_grpc_pb');
const WorkerLifecycleMgr = require('./worker-lifecycle-mgr');

const fs = require('fs');
const grpc = require('grpc');

console.log('Initializing firebase connection...');

const firebaseServiceAccount = JSON.parse(
  fs.readFileSync(process.env.FIREBASE_SERVICE_ACCOUNT).toString(),
);

FirebaseAdmin.initializeApp({
  credential: FirebaseAdmin.credential.cert(firebaseServiceAccount),
  databaseURL: `https://${process.env.FIREBASE_PROJECT_ID}.firebaseio.com`,
});

console.log('Configuring Worker Lifecycle Manager...');
WorkerLifecycleMgr.configure();

const port = process.env.PORT || '50051';

const server = new grpc.Server();
server.addService(GRPCMLServices.MLService, Endpoints);

server.bind(`localhost:${port}`, grpc.ServerCredentials.createInsecure());
server.start();

console.log(`Listening on port ${port}`);
