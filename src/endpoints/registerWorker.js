const DB = require('../db-DEPRECATED');
const GRPCUtils = require('../grpc-utils');
const Worker = require('../models-DEPRECATED/Worker');

async function registerWorker(call, callback) {
  console.log('RegisterWorkflowRun: Calling');

  const { request } = call;
  const projectID = request.getProjectId();

  const worker = Worker.create({ projectID });
  await DB.genSetModel(Worker, worker);

  console.log(`RegisterWorker: Saved worker: ${worker.id}`);

  const message = GRPCUtils.Worker.createMessage(worker);
  callback(null, message);
}

module.exports = registerWorker;
