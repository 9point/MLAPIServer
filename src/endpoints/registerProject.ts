import * as DB from '../db';
import * as GRPCProject from '../grpc-utils/Project';
import ProjectModule, { Model as Project } from '../models/Project';

import { EndpointCall, EndpointCallback } from '../grpc-utils/types';

export default async function registerProject(
  call: EndpointCall,
  callback: EndpointCallback,
) {
  console.log('[RegisterProject]: Calling');

  const { request } = call;
  const name = request.getName();

  let project = await genFetchProjectWithName(name);

  if (project) {
    console.log(`[RegisterProject]: Registering existing project: ${name}`);
    return callback(null, GRPCProject.createMessage(project));
  }

  // Need to create a new project.
  project = ProjectModule.create({ name });
  await DB.genSetModel(ProjectModule, project);

  callback(null, GRPCProject.createMessage(project));
}

function genFetchProjectWithName(name: string): Promise<Project | null> {
  const query = DB.createQuery(ProjectModule, (_) =>
    _.where('isDeleted', '==', false).where('name', '==', name),
  );

  return DB.genRunQueryOne(query);
}
