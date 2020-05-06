const DB = require('../db-DEPRECATED');
const GRPCUtils = require('../grpc-utils-DEPRECATED');
const Task = require('../models-DEPRECATED/Task');
const Workflow = require('../models-DEPRECATED/Workflow');

const assert = require('assert');

function sleep(millis) {
  return new Promise((resolve) => setTimeout(resolve, millis));
}

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

    const workflowQuery = DB.createQuery(Workflow, (_) =>
      _.where('projectRef.refID', '==', projectIDs[0]).where(
        'isDeleted',
        '==',
        false,
      ),
    );
    const allWorkflows = await DB.genRunQuery(workflowQuery);

    const taskQuery = DB.createQuery(Task, (_) =>
      _.where('projectRef.refID', '==', projectIDs[0]).where(
        'isDeleted',
        '==',
        false,
      ),
    );

    const allTasks = await DB.genRunQuery(taskQuery);

    const removedWorkflows = allWorkflows.filter(
      (wf) => !requests.some((req) => req.getName() === wf.name),
    );

    const existingWorkflows = allWorkflows.filter((wf) =>
      requests.some((req) => req.getName() === wf.name),
    );

    const newWorkflows = requests
      .filter((req) => !allWorkflows.some((wf) => wf.name === req.getName()))
      .map((req) => {
        const taskNames = req
          .getTaskNames()
          .split('|')
          .map((name) => {
            const nameVersion = name.split(':');
            assert(nameVersion.length <= 2);
            return nameVersion.length === 1
              ? [nameVersion[0], null]
              : nameVersion;
          });

        const taskIDs = taskNames.map((nameVersion) => {
          const [name, version] = nameVersion;
          const task = allTasks.find(
            (t) =>
              t.name === name && (version === null || version === task.version),
          );

          assert(task);
          return task.id;
        });

        return Workflow.create({
          name: req.getName(),
          projectID: projectIDs[0],
          taskIDs,
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

    const deletePromises = removedWorkflows.map((wf) =>
      DB.genDeleteModel(Workflow, wf),
    );
    const createPromises = newWorkflows.map((wf) =>
      DB.genSetModel(Workflow, wf),
    );

    await Promise.all(deletePromises.concat(createPromises));

    const currentWorkflows = existingWorkflows.concat(newWorkflows);
    for (const workflow of currentWorkflows) {
      const message = GRPCUtils.Workflow.createMessage(workflow, allTasks);
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
