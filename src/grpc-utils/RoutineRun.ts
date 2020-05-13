import GRPCMLMessages from '../static_codegen/mlservice_pb';

import { Message } from './types';
import { Model as RoutineRun } from '../models/RoutineRun';

export function createMessage(routineRun: RoutineRun): Message {
  // @ts-ignore
  const status = GRPCMLMessages.Obj_RoutineRun.Status[routineRun.status];

  if (typeof status !== 'number') {
    throw Error(`Invalid worker status: ${routineRun.status}`);
  }

  // @ts-ignore
  const message = new GRPCMLMessages.Obj_RoutineRun();

  message.setId(routineRun.id);
  message.setCreatedAt(Math.floor(routineRun.createdAt.getTime() / 1000));
  message.setIsDeleted(routineRun.isDeleted);
  routineRun.parentRunRef &&
    message.setParentRunId(routineRun.parentRunRef.refID);
  routineRun.requestingWorkerRef &&
    message.setRequestingWorkerId(routineRun.requestingWorkerRef.refID);
  message.setRoutineDbid(routineRun.routineRef.refID);
  message.setStatus(status);
  message.setUpdatedAt(Math.floor(routineRun.updatedAt.getTime() / 1000));

  return message;
}
