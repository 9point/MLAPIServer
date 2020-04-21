const GRPCUtils = require('../grpc-utils');
const Semver = require('../Semver');
const Task = require('../models/Task');

const nullthrows = require('nullthrows');

async function registerTasks(call) {
  console.log('RegisterTasks: Calling');

  // Maps workflow id to all tasks for that workflow.
  const requests = [];

  call.on(
    'data',
    GRPCUtils.ErrorUtils.handleStreamError(call, (request) => {
      console.log('RegisterTasks: Receiving request');
      requests.push(request);
    }),
  );

  call.on(
    'end',
    GRPCUtils.ErrorUtils.handleStreamError(call, async () => {
      console.log('RegisterTasks: Done receiving request');

      if (requests.length === 0) {
        console.error('RegisterTasks: Did not receive any requests');
        call.end();
        return;
      }

      if (hasMultipleRequestsWithSameName(requests)) {
        console.error(
          'RegisterTasks: Multiple tasks are being reigstered with the same name.',
        );
        call.end();
        return;
      }

      const projectIDs = requests.map((req) => req.getProjectRefId());
      if (projectIDs.some((id) => id !== projectIDs[0])) {
        console.error(
          'RegisterTasks: All tasks being registered must belong to the same project',
        );
        call.end();
        return;
      }

      const allTasks = await Task.find({
        'projectRef.refID': projectIDs[0],
        isDeleted: false,
      });

      const removedTasks = allTasks.filter(
        (task) => !requests.some((req) => req.getName() === task.name),
      );

      const existingTasks = allTasks.filter((task) =>
        requests.some((req) => req.getName() === task.name),
      );

      const now = new Date();
      const newTasks = requests
        .filter((req) => !allTasks.some((task) => task.name === req.getName()))
        .map((req) => {
          const semver = Semver.parse(req.getVersion());

          return new Task({
            __modelType__: 'Task',
            __type__: 'Model',
            createdAt: now,
            isDeleted: false,
            isMutable: semver.dev,
            name: req.getName(),
            projectRef: {
              __type__: 'Ref',
              refID: projectIDs[0],
              refType: 'Project',
            },
            updatedAt: now,
            version: req.getVersion(),
          });
        });

      const changedTasks = [];

      for (const task of existingTasks) {
        // Find the corresponding request.
        const req = nullthrows(requests.find((r) => r.getName() === task.name));
        const fromSemver = Semver.parse(task.version);
        const toSemver = Semver.parse(req.getVersion());

        if (Semver.isEqual(fromSemver, toSemver)) {
          continue;
        }

        if (!Semver.isValidTransition(fromSemver, toSemver)) {
          throw Error(
            `Invalid Semver transition for task ${task.name}: ${
              task.version
            } -> ${req.getVersion()}`,
          );
        }

        task.version = req.getVersion();
        task.isMutable = toSemver.dev;
        changedTasks.push(changedTasks);
      }

      for (const task of removedTasks) {
        task.isDeleted = true;
      }

      console.log(`RegisterTasks: Creating ${newTasks.length} task(s).`);
      console.log(`RegisterTasks: Updated ${changedTasks.length} task(s).`);
      console.log(`RegisterTasks: Removing ${removedTasks.length} task(s).`);
      console.log(
        `RegisterTasks: ${
          existingTasks.length - changedTasks.length
        } unchanged task(s).`,
      );

      await Promise.all(
        removedTasks
          .concat(newTasks)
          .concat(changedTasks)
          .map((task) => task.save()),
      );

      const currentTasks = existingTasks.concat(newTasks);

      for (const task of currentTasks) {
        const message = GRPCUtils.Task.createMessage(task);
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
module.exports = registerTasks;
