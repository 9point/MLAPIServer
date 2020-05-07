import GRPCMLMessages from '../static_codegen/mlservice_pb';

import { Message } from './types';
import { Model as Worker } from '../models/Worker';

export function createMessage(worker: Worker): Message {
  // @ts-ignore
  const status = GRPCMLMessages.Obj_Worker.Status[worker.status];

  if (typeof status !== 'number') {
    throw Error(`Invalid worker status: ${worker.status}`);
  }

  // @ts-ignore
  const message = new GRPCMLMessages.Obj_Worker();
  message.setId(worker.id);
  message.setCreatedAt(Math.floor(worker.createdAt.getTime() / 1000));
  message.setIsDeleted(worker.isDeleted);
  message.setProjectId(worker.projectRef.refID);
  message.setRoutines(worker.routines.join('|'));
  message.setStatus(status);
  message.setUpdatedAt(Math.floor(worker.updatedAt.getTime() / 1000));
  return message;
}
