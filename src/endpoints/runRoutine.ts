import * as GRPCRoutineRun from '../grpc-utils/RoutineRun';
import WorkerLifecycleMgr from '../worker-lifecycle-mgr';

import { EndpointCall, EndpointCallback } from '../grpc-utils/types';
import { parseFull as parseFullRoutineID } from '../routine-id';

export default async function runRoutine(
  call: EndpointCall,
  callback: EndpointCallback,
) {
  console.log('[RunRoutine]: Calling');

  const { request } = call;

  const serialArgs = request.getArguments();
  const serialRoutineID = request.getRoutineId();

  const args = JSON.parse(serialArgs);
  const routineID = parseFullRoutineID(serialRoutineID);

  const run = await WorkerLifecycleMgr.genRunRoutine(routineID, args);
  const message = GRPCRoutineRun.createMessage(run);
  callback(null, message);
}
