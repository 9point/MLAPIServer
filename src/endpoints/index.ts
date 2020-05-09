import ErrorUtils from '../grpc-utils-DEPRECATED/error-utils';

import getProject from './getProject';
import getWorkflow from './getWorkflow';
import registerProject from './registerProject';
import registerTasks from './registerTasks';
import registerWorker from './registerWorker';
import registerWorkflows from './registerWorkflows';
import routeWorkerDirectives from './routeWorkerDirectives';
import registerContainerImage from './registerContainerImage';

// prettier-ignore

export default {
  getProject: ErrorUtils.handleCallbackEndpointError(getProject),
  getWorkflow: ErrorUtils.handleCallbackEndpointError(getWorkflow),
  registerContainerImage: ErrorUtils.handleCallbackEndpointError(registerContainerImage),
  registerProject: ErrorUtils.handleCallbackEndpointError(registerProject),
  registerTasks: ErrorUtils.handleStreamEndpointError(registerTasks),
  registerWorker: ErrorUtils.handleCallbackEndpointError(registerWorker),
  registerWorkflows: ErrorUtils.handleStreamEndpointError(registerWorkflows),
  routeWorkerDirectives: ErrorUtils.handleStreamEndpointError(routeWorkerDirectives),
};
