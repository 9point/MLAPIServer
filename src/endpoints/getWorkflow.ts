import * as DB from '../db';
import * as GRPCWorkflow from '../grpc-utils/Workflow';
import WorkflowModule from '../models/Workflow';

import { EndpointCall, EndpointCallback } from '../grpc-utils/types';

export default async function getWorkflow(
  call: EndpointCall,
  callback: EndpointCallback,
) {
  console.log('GetWorkflow: Calling');

  const { request } = call;
  const projectID = request.getProjectId();
  const name = request.getName();

  const query = DB.createQuery(WorkflowModule, (_) =>
    _.where('name', '==', name)
      .where('projectRef.refID', '==', projectID)
      .where('isDeleted', '==', false),
  );

  const workflow = await DB.genRunQueryOne(query);

  if (!workflow) {
    return callback(Error(`No workflow named ${name} in project ${projectID}`));
  }

  const message = GRPCWorkflow.createMessage(workflow);
  callback(null, message);
}
