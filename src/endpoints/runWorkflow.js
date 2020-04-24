const DB = require('../db');
const GRPCMLMessages = require('../static_codegen/mlservice_pb');
const GRPCUtils = require('../grpc-utils');
const Worker = require('../models/Worker');
const Workflow = require('../models/Workflow');
const WorkflowRun = require('../models/WorkflowRun');

async function runWorkflow(call, callback) {
  console.log('RunWorkflow: Calling');

  const { request } = call;
  const workflowID = request.getWorkflowId();

  const workflow = await DB.genFetchModel(Workflow, workflowID);

  if (!workflow) {
    throw Error(`No workflow found with id ${workflowID}`);
  }

  const projectID = workflow.projectRef.refID;

  const query = DB.createQuery(Worker, (_) =>
    _.where('projectRef.refID', '==', projectID)
      .where('status', 'in', ['INITIALIZING', 'IDLE', 'WORKING'])
      .where('isDeleted', '==', false),
  );

  const workers = await DB.genRunQuery(query);

  if (workers.length === 0) {
    throw Error(
      `No usable workers found for project: ${projectID}. Must initialize a worker.`,
    );
  }

  console.log(`RunWorkflow: Found ${workers.length} usable worker(s).`);
}

module.exports = runWorkflow;
