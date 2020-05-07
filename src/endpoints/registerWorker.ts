import * as DB from '../db';
import * as GRPCWorker from '../grpc-utils/Worker';
import WorkerModule from '../models/Worker';

import { EndpointCall, EndpointCallback } from '../grpc-utils/types';
import { parse as parseRoutineID } from '../routine-id';

export default async function registerWorker(
  call: EndpointCall,
  callback: EndpointCallback,
) {
  console.log('[RegisterWorker]: Calling');

  const { request } = call;
  const projectID: string = request.getProjectId();
  const routines: string[] = request.getRoutines().split('|');

  // Parsing will throw error if not a valid id.
  routines.forEach((r) => parseRoutineID(r));

  const worker = WorkerModule.create({ projectID, routines });
  await DB.genSetModel(WorkerModule, worker);

  console.log(`[RegisterWorker]: Saved worker: ${worker.id}`);

  const message = GRPCWorker.createMessage(worker);
  callback(null, message);
}
