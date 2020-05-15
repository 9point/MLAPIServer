import * as DB from '../db';
import * as GRPCErrorUtils from '../grpc-utils/error-utils';
import * as GRPCWorkflow from '../grpc-utils/Workflow';
import WorkflowModule, { Model as Workflow } from '../models/Workflow';

import { EndpointCallWritable, Message } from '../grpc-utils/types';

export default async function registerWorkflows(call: EndpointCallWritable) {
  console.log('RegisterWorkflows: Calling');

  const requests: Message[] = [];

  function onData(request: Message) {
    console.log('[RegisterWorkflows]: Receiving request');
    requests.push(request);
  }

  async function onEnd() {
    console.log('[RegisterWorkflows]: Done Receiving requests');

    validate(requests);

    const projectID = requests[0].getProjectRefId();

    const workflows = await Promise.all(
      requests.map((req) => genRegisterWorkflow(req)),
    );

    for (const workflow of workflows) {
      const message = GRPCWorkflow.createMessage(workflow);
      call.write(message);
    }

    call.end();
  }

  call.on('data', GRPCErrorUtils.handleStreamError(call, onData));
  call.on('end', GRPCErrorUtils.handleStreamError(call, onEnd));
}

function validate(requests: Message[]) {
  if (requests.length === 0) {
    throw Error('RegisterWorkflows: Did not receive any requests.');
  }

  const hasMultipleRequestsWithSameName = requests.some(
    (req) =>
      requests.filter((_req) => req.getName() === _req.getName()).length > 1,
  );

  if (hasMultipleRequestsWithSameName) {
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
}

async function genRegisterWorkflow(request: Message): Promise<Workflow> {
  const projectID = request.getProjectRefId();
  const name = request.getName();

  const query = DB.createQuery(WorkflowModule, (_) =>
    _.where('isDeleted', '==', false)
      .where('projectRef.refID', '==', projectID)
      .where('name', '==', name)
      .limit(1),
  );

  let workflow = await DB.genRunQueryOne(query);

  if (workflow) {
    return workflow;
  }

  // No workflow found. Need to create one.
  workflow = WorkflowModule.create({ name, projectID });
  await DB.genSetModel(WorkflowModule, workflow);

  return workflow;
}
