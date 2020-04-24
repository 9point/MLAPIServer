const DB = require('../db');
const GRPCUtils = require('../grpc-utils');
const Workflow = require('../models/Workflow');

async function registerWorkflows(call) {
  console.log('RegisterWorkflows: Calling');

  const requests = [];

  function onData(request) {
    console.log('RegisterWorkflows: Receiving request');
    requests.push(request);
  }

  async function onEnd() {
    if (requests.length === 0) {
      throw Error('RegisterWorkflows: Did not receive any requests.');
    }

    if (hasMultipleRequestsWithSameName(requests)) {
      throw Error(
        'RegisterWorkflows: Multiple workflows are being registered with the same name.',
      );
    }

    const projectIDs = requests.map((req) => req.getProjectRefId());
    if (projectIDs.some((id) => id !== projectIDs[0])) {
      throw Error(
        'RegisterWorkflows: All workflows being registered must belong to the same project.',
      );
    }

    const query = DB.createQuery(Workflow, (_) =>
      _.where('projectRef.refID', '==', projectIDs[0]).where(
        'isDeleted',
        '==',
        false,
      ),
    );
    const allWorkflows = await DB.genRunQuery(query);

    const removedWorkflows = allWorkflows.filter(
      (wf) => !requests.some((req) => req.getName() === wf.name),
    );

    const existingWorkflows = allWorkflows.filter((wf) =>
      requests.some((req) => req.getName() === wf.name),
    );

    const newWorkflows = requests
      .filter((req) => !allWorkflows.some((wf) => wf.name === req.getName()))
      .map((req) =>
        Workflow.create({
          name: req.getName(),
          projectID: projectIDs[0],
        }),
      );

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

    const deletePromises = removedWorkflows.map((wf) =>
      DB.genDeleteModel(Workflow, wf),
    );
    const createPromises = newWorkflows.map((wf) =>
      DB.genSetModel(Workflow, wf),
    );

    await Promise.all(deletePromises.concat(createPromises));

    const currentWorkflows = existingWorkflows.concat(newWorkflows);
    for (const workflow of currentWorkflows) {
      const message = GRPCUtils.Workflow.createMessage(workflow);
      call.write(message);
    }

    call.end();
  }

  call.on('data', GRPCUtils.ErrorUtils.handleStreamError(call, onData));
  call.on('end', GRPCUtils.ErrorUtils.handleStreamError(call, onEnd));
}

function hasMultipleRequestsWithSameName(requests) {
  return requests.some(
    (req) =>
      requests.filter((_req) => req.getName() === _req.getName()).length > 1,
  );
}
module.exports = registerWorkflows;
