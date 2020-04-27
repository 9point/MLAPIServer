const DB = require('../db');
const GRPCUtils = require('../grpc-utils');
const WorkerLifecycleMgr = require('../worker-lifecycle-mgr');
const Workflow = require('../models/Workflow');

async function runWorkflow(call, callback) {
  console.log('RunWorkflow: Calling');

  const { request } = call;
  const projectID = request.getProjectId();
  const workflowName = request.getWorkflowName();

  const query = DB.createQuery(Workflow, (_) =>
    _.where('isDeleted', '==', false)
      .where('projectRef.refID', '==', projectID)
      .where('name', '==', workflowName),
  );

  const workflow = await DB.genRunQueryOne(query);

  if (!workflow) {
    throw Error(`No workflow named ${workflowName} in project ${projectID}`);
  }

  const workflowRun = await WorkerLifecycleMgr.genRunWorkflow(workflow);
  const message = GRPCUtils.WorkflowRun.createMessage(workflowRun);

  callback(null, message);
}

module.exports = runWorkflow;
