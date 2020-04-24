const WorkerLifecycleMgr = require('../worker-lifecycle-mgr');

async function routeWorkerDirectives(call) {
  console.log('RouteWorkerDirectives: Calling');
  WorkerLifecycleMgr.registerDirectiveRouter(call);
}

module.exports = routeWorkerDirectives;
