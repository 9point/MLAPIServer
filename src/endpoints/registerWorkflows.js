const GRPCUtils = require('../grpc-utils');
const Workflow = require('../models/Workflow');

async function registerWorkflows(call) {
  console.log('Calling: RegisterWorkflow');

  const { request } = call;
  const workflowNames = request.getNames().split('|');
  const projectRefID = request.getProjectRefId();

  const workflows = await Workflow.find({
    isDeleted: false,
    'projectRef.refID': projectRefID,
  });

  const workflowsToDelete = workflows.filter(
    (wf) => !workflowNames.includes(wf.name),
  );

  for (const wf of workflowsToDelete) {
    wf.isDeleted = true;
  }

  const now = new Date();
  const workflowsToCreate = workflowNames
    .filter((name) => !workflows.some((wf) => wf.name === name))
    .map(
      (name) =>
        new Workflow({
          __modelType__: 'Workflow',
          __type__: 'Model',
          createdAt: now,
          isDeleted: false,
          name,
          projectRef: {
            __type__: 'Ref',
            refID: projectRefID,
            refType: 'Project',
          },
          updatedAt: now,
        }),
    );

  console.log(`Registering ${workflowsToCreate.length} new workflow(s).`);
  console.log(`Removing ${workflowsToDelete.length} existing workflow(s).`);

  const allWorkflows = workflowsToCreate.concat(workflowsToDelete);

  await Promise.all(allWorkflows.map((wf) => wf.save()));

  for (workflow of allWorkflows) {
    const message = GRPCUtils.Workflow.createMessage(workflow);
    call.write(message);
  }
  call.end();
}

module.exports = registerWorkflows;
