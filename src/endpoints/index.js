const GRPCUtils = require('../grpc-utils');

const getProject = require('./getProject');
const registerProject = require('./registerProject');
const registerTasks = require('./registerTasks');
const registerWorker = require('./registerWorker');
const registerWorkflows = require('./registerWorkflows');
const routeWorkerDirectives = require('./routeWorkerDirectives');

module.exports = {
  getProject: GRPCUtils.ErrorUtils.handleCallbackEndpointError(getProject),

  registerProject: GRPCUtils.ErrorUtils.handleCallbackEndpointError(
    registerProject,
  ),

  registerTasks: GRPCUtils.ErrorUtils.handleStreamEndpointError(registerTasks),

  registerWorker: GRPCUtils.ErrorUtils.handleCallbackEndpointError(
    registerWorker,
  ),

  registerWorkflows: GRPCUtils.ErrorUtils.handleStreamEndpointError(
    registerWorkflows,
  ),

  routeWorkerDirectives: GRPCUtils.ErrorUtils.handleStreamEndpointError(
    routeWorkerDirectives,
  ),
};
