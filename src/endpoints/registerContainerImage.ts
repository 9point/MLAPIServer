import * as DB from '../db';
import * as GRPCContainerImage from '../grpc-utils/ContainerImage';
import ContainerImageModule, {
  Model as ContainerImage,
} from '../models/ContainerImage';

import { EndpointCall, EndpointCallback, Message } from '../grpc-utils/types';

export default async function registerContainerImage(
  call: EndpointCall,
  callback: EndpointCallback,
) {
  console.log('[RegisterContainerImage]: Calling');

  const { request } = call;

  const name = request.getName();
  const projectID = request.getProjectId();
  const taskIDs = request.getTaskIds().split('|');
  const workflowIDs = request.getWorkflowIds().split('|');

  let containerImage = await genFetchContainerImage(name);

  if (containerImage) {
    // Make sure the existing container image is registed for the
    // same project.
    if (containerImage.projectRef.refID !== projectID) {
      throw Error(
        `Trying to create a container image with the same name as a different image`,
      );
    }

    const message = GRPCContainerImage.createMessage(containerImage);
    return callback(null, message);
  }

  // No container image with this name was found. Create a new image.

  containerImage = ContainerImageModule.create({
    name,
    projectID,
    taskIDs,
    workflowIDs,
  });

  await DB.genSetModel(ContainerImageModule, containerImage);

  const message = GRPCContainerImage.createMessage(containerImage);
  callback(null, message);
}

async function genFetchContainerImage(
  name: string,
): Promise<ContainerImage | null> {
  const query = DB.createQuery(ContainerImageModule, (_) =>
    _.where('isDeleted', '==', false).where('name', '==', name).limit(1),
  );

  return await DB.genRunQueryOne(query);
}
