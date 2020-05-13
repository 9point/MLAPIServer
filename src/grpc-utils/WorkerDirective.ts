import GRPCMLMessages from '../static_codegen/mlservice_pb';

import { Message } from './types';
import { Model as WorkerDirective } from '../models/WorkerDirective';

export function createMessage(workerDirective: WorkerDirective): Message {
  const directiveType =
    // @ts-ignore
    GRPCMLMessages.WorkerDirectiveType[workerDirective.directiveType];

  if (typeof directiveType !== 'number') {
    throw Error(
      `Unrecognized directive type: ${workerDirective.directiveType}`,
    );
  }

  // @ts-ignore
  const message = new GRPCMLMessages.Obj_WorkerDirective();
  message.setCreatedAt(Math.floor(workerDirective.createdAt.getTime() / 1000));
  message.setDirectiveType(directiveType);
  workerDirective.fromWorkerRef &&
    message.setFromWorkerId(workerDirective.fromWorkerRef.refID);
  message.setId(workerDirective.id);
  message.setIsDeleted(workerDirective.isDeleted);
  message.setPayload(JSON.stringify(workerDirective.payload));
  message.setPayloadKey(workerDirective.payloadKey);
  workerDirective.toWorkerRef &&
    message.setToWorkerId(workerDirective.toWorkerRef.refID);
  message.setUpdatedAt(Math.floor(workerDirective.updatedAt.getTime() / 1000));

  return message;
}
