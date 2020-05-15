import * as GRPCErrorUtils from '../grpc-utils/error-utils';

import getProject from './getProject';
import getWorkflow from './getWorkflow';
import registerProject from './registerProject';
import registerTasks from './registerTasks';
import registerWorker from './registerWorker';
import registerWorkflows from './registerWorkflows';
import routeWorkerDirectives from './routeWorkerDirectives';
import registerContainerImage from './registerContainerImage';
import runRoutine from './runRoutine';

// prettier-ignore

export default {
  getProject: GRPCErrorUtils.handleCallbackEndpointError(getProject),
  getWorkflow: GRPCErrorUtils.handleCallbackEndpointError(getWorkflow),
  registerContainerImage: GRPCErrorUtils.handleCallbackEndpointError(registerContainerImage),
  registerProject: GRPCErrorUtils.handleCallbackEndpointError(registerProject),
  registerTasks: GRPCErrorUtils.handleStreamEndpointError(registerTasks),
  registerWorker: GRPCErrorUtils.handleCallbackEndpointError(registerWorker),
  registerWorkflows: GRPCErrorUtils.handleStreamEndpointError(registerWorkflows),
  routeWorkerDirectives: GRPCErrorUtils.handleStreamEndpointError(routeWorkerDirectives),
  runRoutine: GRPCErrorUtils.handleCallbackEndpointError(runRoutine),
};
