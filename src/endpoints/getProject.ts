import * as DB from '../db';
import * as GRPCProject from '../grpc-utils/Project';
import ProjectModule from '../models/Project';

import { EndpointCall, EndpointCallback } from '../grpc-utils/types';

export default async function getProject(
  call: EndpointCall,
  callback: EndpointCallback,
) {
  console.log('[GetProject]: Calling');

  const { request } = call;

  const name = request.getName();

  const query = DB.createQuery(ProjectModule, (_) =>
    _.where('name', '==', name).where('isDeleted', '==', false),
  );

  const project = await DB.genRunQueryOne(query);

  if (!project) {
    return callback(Error(`No project named ${name} was found.`));
  }

  const message = GRPCProject.createMessage(project);
  callback(null, message);
}
