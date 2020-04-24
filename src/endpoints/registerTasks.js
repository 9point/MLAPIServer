const DB = require('../db');
const GRPCUtils = require('../grpc-utils');
const Semver = require('../semver');
const Task = require('../models/Task');

const nullthrows = require('nullthrows');

async function registerTasks(call) {
  console.log('RegisterTasks: Calling');

  // Maps workflow id to all tasks for that workflow.
  const requests = [];

  function onData(request) {
    console.log('RegisterTasks: Receiving request');
    requests.push(request);
  }

  async function onEnd() {
    console.log('RegisterTasks: Done receiving request');

    if (requests.length === 0) {
      throw Error('RegisterTasks: Did not receive any requests');
    }

    if (hasMultipleRequestsWithSameName(requests)) {
      throw Error(
        'RegisterTasks: Multiple tasks are being reigstered with the same name.',
      );
    }

    const projectIDs = requests.map((req) => req.getProjectRefId());
    if (projectIDs.some((id) => id !== projectIDs[0])) {
      throw Error(
        'RegisterTasks: All tasks being registered must belong to the same project',
      );
    }

    const query = DB.createQuery(Task, (_) =>
      _.where('projectRef.refID', '==', projectIDs[0]).where(
        'isDeleted',
        '==',
        false,
      ),
    );

    const allTasks = await DB.genRunQuery(query);

    const removedTasks = allTasks.filter(
      (task) => !requests.some((req) => req.getName() === task.name),
    );

    const existingTasks = allTasks.filter((task) =>
      requests.some((req) => req.getName() === task.name),
    );

    const newTasks = requests
      .filter((req) => !allTasks.some((task) => task.name === req.getName()))
      .map((req) =>
        Task.create({
          name: req.getName(),
          projectID: projectIDs[0],
          version: req.getVersion(),
        }),
      );

    const changedTasks = [];

    for (const task of existingTasks) {
      // Find the corresponding request.
      const req = nullthrows(requests.find((r) => r.getName() === task.name));
      const fromSemver = Semver.parse(task.version);
      const toSemver = Semver.parse(req.getVersion());

      if (Semver.isEqual(fromSemver, toSemver)) {
        continue;
      }

      changedTasks.push(Task.set(task, { version: req.getVersion() }));
    }

    console.log(`RegisterTasks: Creating ${newTasks.length} task(s).`);
    console.log(`RegisterTasks: Updated ${changedTasks.length} task(s).`);
    console.log(`RegisterTasks: Removing ${removedTasks.length} task(s).`);
    console.log(
      `RegisterTasks: ${
        existingTasks.length - changedTasks.length
      } unchanged task(s).`,
    );

    const deletePromises = removedTasks.map((t) => DB.genDeleteModel(Task, t));
    const createPromises = newTasks.map((t) => DB.genSetModel(Task, t));
    const changePromises = changedTasks.map((t) => DB.genSetModel(Task, t));

    await Promise.all(
      deletePromises.concat(createPromises).concat(changePromises),
    );

    const currentTasks = existingTasks.concat(newTasks);

    for (const task of currentTasks) {
      const message = GRPCUtils.Task.createMessage(task);
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
module.exports = registerTasks;
