const GRPCUtils = require('../grpc-utils');
const Workflow = require('../models/Workflow');

async function registerWorkflows(call) {
  console.log('RegisterWorkflows: Calling');

  const requests = [];

  call.on(
    'data',
    GRPCUtils.ErrorUtils.handleStreamError(call, (request) => {
      console.log('RegisterWorkflows: Receiving request');
      requests.push(request);
    }),
  );

  call.on(
    'end',
    GRPCUtils.ErrorUtils.handleStreamError(call, async () => {
      if (requests.length === 0) {
        console.error('RegisterWorkflows: Did not receive any requests.');
        call.end();
        return;
      }

      if (hasMultipleRequestsWithSameName(requests)) {
        console.error(
          'RegisterWorkflows: Multiple workflows are being registered with the same name.',
        );
        call.end();
        return;
      }

      const projectIDs = requests.map((req) => req.getProjectRefId());
      if (projectIDs.some((id) => id !== projectIDs[0])) {
        console.error(
          'RegisterWorkflows: All workflows being registered must belong to the same project.',
        );
        call.end();
        return;
      }

      const allWorkflows = await Workflow.find({
        isDeleted: false,
        'projectRef.refID': projectIDs[0],
      });

      const removedWorkflows = allWorkflows.filter(
        (wf) => !requests.some((req) => req.getName() === wf.name),
      );

      const existingWorkflows = allWorkflows.filter((wf) =>
        requests.some((req) => req.getName() === wf.name),
      );

      const now = new Date();
      const newWorkflows = requests
        .filter((req) => !allWorkflows.some((wf) => wf.name === req.getName()))
        .map((req) => {
          return new Workflow({
            __modelType__: 'Workflow',
            __type__: 'Model',
            createdAt: now,
            isDeleted: false,
            name: req.getName(),
            projectRef: {
              __type__: 'Ref',
              refID: projectIDs[0],
              refType: 'Project',
            },
            updatedAt: now,
          });
        });

      for (const wf of removedWorkflows) {
        wf.isDeleted = false;
      }

      console.log(
        `RegisterWorkflows: Creating ${newWorkflows.length} workflow(s).`,
      );
      console.log(
        `RegisterWorkflows: Removing ${removedWorkflows.length} workflow(s).`,
      );
      console.log(
        `RegisterWorkflows: ${existingWorkflows.length} unchanged workflow(s).`,
      );

      await Promise.all(
        removedWorkflows.concat(newWorkflows).map((wf) => wf.save()),
      );

      const currentWorkflows = existingWorkflows.concat(newWorkflows);
      for (const workflow of currentWorkflows) {
        const message = GRPCUtils.Workflow.createMessage(workflow);
        call.write(message);
      }

      call.end();
    }),
  );
}

function hasMultipleRequestsWithSameName(requests) {
  return requests.some(
    (req) =>
      requests.filter((_req) => req.getName() === _req.getName()).length > 1,
  );
}
module.exports = registerWorkflows;
