const DB = require('../db');
const GRPCUtils = require('../grpc-utils');
const Workflow = require('../models-DEPRECATED/Workflow');

async function getWorkflow(call, callback) {
  console.log('GetWorkflow: Calling');

  const { request } = call;
  const projectID = request.getProjectId();
  const name = request.getName();

  const query = DB.createQuery(Workflow, (_) =>
    _.where('name', '==', name)
      .where('projectRef.refID', '==', projectID)
      .where('isDeleted', '==', false),
  );

  const workflow = await DB.genRunQueryOne(query);

  if (!workflow) {
    callback(Error(`No workflow named ${name} in project ${projectID}`));
  }

  const message = GRPCUtils.Workflow.createMessage(workflow);
  callback(null, message);
}

module.exports = getWorkflow;
