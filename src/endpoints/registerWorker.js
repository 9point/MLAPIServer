const GRPCMLMessages = require('../static_codegen/mlservice_pb');
const GRPCUtils = require('../grpc-utils');
const Worker = require('../models/Worker');

async function registerWorker(call, callback) {
  console.log('RegisterWorkflowRun: Calling');

  const { request } = call;
  const projectID = request.getProjectId();
  const worker = Worker.build({ projectID });

  await worker.save();

  console.log(`RegisterWorker: Saved worker: ${worker._id.toString()}`);

  const message = GRPCUtils.Worker.createMessage(worker);
  callback(null, message);
}

module.exports = registerWorker;
