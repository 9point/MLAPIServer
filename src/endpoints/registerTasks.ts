import * as DB from '../db';
import * as GRPCTask from '../grpc-utils/Task';
import GRPCErrorUtils from '../grpc-utils/error-utils';
import TaskModule from '../models/Task';

import { EndpointCallWritable, Message } from '../grpc-utils/types';
import { Model as Task } from '../models/Task';
import { RoutineID, parse as parseRoutineID } from '../routine-id';

export default async function registerTasks(call: EndpointCallWritable) {
  console.log('[RegisterTasks]: Calling');

  // Maps workflow id to all tasks for that workflow.
  const requests: Message[] = [];

  function onData(request: Message) {
    console.log('[RegisterTasks]: Receiving request');
    requests.push(request);
  }

  async function onEnd() {
    console.log('[RegisterTasks]: Processing Requests');
    console.log(`[RegisterTasks]: Request Count: ${requests.length}`);

    console.log('[RegisterTasks]: Validating Requests');
    validateRequests(requests);

    const projectID = requests[0].getProjectRefId();

    console.log('[RegisterTasks]: Registering');

    const tasks = await Promise.all(
      requests.map((req) => genRegisterTask(projectID, req)),
    );

    console.log('[RegisterTasks]: Done Registering');

    for (const task of tasks) {
      const message = GRPCTask.createMessage(task);
      call.write(message);
    }

    call.end();
  }

  call.on('data', GRPCErrorUtils.handleStreamError(call, onData));
  call.on('end', GRPCErrorUtils.handleStreamError(call, onEnd));
}

function validateRequests(requests: Message[]) {
  if (requests.length === 0) {
    throw Error('[RegisterTasks]: Did not receive any requests');
  }

  const hasMultipleRequestsWithSameName = requests.some(
    (req) =>
      requests.filter((_req) => req.getName() === _req.getName()).length > 1,
  );

  if (hasMultipleRequestsWithSameName) {
    throw Error(
      '[RegisterTasks]: Multiple tasks are being reigstered with the same name.',
    );
  }

  const projectIDs = requests.map((req) => req.getProjectRefId());
  const hasMultipleProjectIDs = projectIDs.some((id) => id !== projectIDs[0]);

  if (hasMultipleProjectIDs) {
    throw Error(
      'RegisterTasks: All tasks being registered must belong to the same project',
    );
  }
}

async function genRegisterTask(
  projectID: string,
  request: Message,
): Promise<Task> {
  const name = request.getName();
  const version = request.getVersion();

  const routineID = parseRoutineID(`tname:${name}:${version}`);

  let task = await genFetchTask(routineID);
  if (task) {
    return task;
  }

  // Could not find an existing task with the given routine id. Need to
  // create a new task.
  task = TaskModule.create({ name, projectID, version });

  await DB.genSetModel(TaskModule, task);

  return task;
}

async function genFetchTask(id: RoutineID): Promise<Task | null> {
  switch (id.type) {
    case 'db': {
      const task = await DB.genFetchModel(TaskModule, id.dbID);
      if (!task || task.isDeleted) {
        throw Error(`Cannot find task with id: ${id.dbID}`);
      }
      return task;
    }

    case 'wfname':
    case 'tname': {
      // Ignoring project name of routine id.

      const query = DB.createQuery(TaskModule, (_) => {
        let q = _.where('isDeleted', '==', false);
        q = q.where('name', '==', id.routineName);

        if (typeof id.version === 'string') {
          q = q.where('version', '==', id.version);
        }

        return q;
      });

      return await DB.genRunQueryOne(query);
    }
  }
}
