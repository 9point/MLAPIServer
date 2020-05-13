import WorkerLifecycleMgr from '../worker-lifecycle-mgr';

import { EndpointCallWritable } from '../grpc-utils/types';

export default async function routeWorkerDirectives(
  call: EndpointCallWritable,
) {
  console.log('[RouteWorkerDirectives]: Calling');
  WorkerLifecycleMgr.registerDirectiveRouter(call);
}
