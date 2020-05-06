import Endpoints from './endpoints';
import FirebaseAdmin from 'firebase-admin';
import GRPCMLServices from './static_codegen/mlservice_grpc_pb';
import WorkerLifecycleMgr from './worker-lifecycle-mgr';

import fs from 'fs';
import grpc from 'grpc';

console.log('[Service] Initializing firebase connection...');

const firebaseServiceAccount = JSON.parse(
  // @ts-ignore
  fs.readFileSync(process.env.FIREBASE_SERVICE_ACCOUNT).toString(),
);

FirebaseAdmin.initializeApp({
  credential: FirebaseAdmin.credential.cert(firebaseServiceAccount),
  databaseURL: `https://${process.env.FIREBASE_PROJECT_ID}.firebaseio.com`,
});

console.log('[Service] Configuring Worker Lifecycle Manager...');
WorkerLifecycleMgr.configure();

const port = process.env.PORT || '50051';
const address = process.env.ADDRESS || 'localhost';

const server = new grpc.Server();
server.addService(GRPCMLServices.MLService, Endpoints);

server.bind(`${address}:${port}`, grpc.ServerCredentials.createInsecure());
server.start();

console.log(`[Service] Listening on  ${address}:${port}`);
