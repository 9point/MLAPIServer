const GRPCMLMessages = require('../static_codegen/mlservice_pb');
const GRPCUtils = require('../grpc-utils');
const Worker = require('../models/Worker');

async function registerWorker(call, callback) {
  console.log('RegisterWorkflowRun: Calling');

  const { request } = call;
  const projectID = request.getProjectId();

  const now = new Date();

  const worker = new Worker({
    __modelType__: 'Worker',
    __type__: 'Model',
    createdAt: now,
    isDeleted: false,
    projectRef: {
      __type__: 'Ref',
      refID: projectID,
      refType: 'Project',
    },
    status: GRPCMLMessages.Obj_Worker.Status.UNRESPONSIVE, // Unresponsive until it connects on a separate endpoint.
    updatedAt: now,
  });

  await worker.save();

  console.log(`RegisterWorker: Saved worker: ${worker._id.toString()}`);

  const message = GRPCUtils.Worker.createMessage(worker);
  callback(null, message);
}

module.exports = registerWorker;
