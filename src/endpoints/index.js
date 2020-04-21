const GRPCUtils = require('../grpc-utils');

const registerProject = require('./registerProject');
const registerTasks = require('./registerTasks');
const registerWorkflows = require('./registerWorkflows');

module.exports = {
  registerProject: GRPCUtils.ErrorUtils.handleCallbackEndpointError(
    registerProject,
  ),

  registerTasks: GRPCUtils.ErrorUtils.handleStreamEndpointError(registerTasks),

  registerWorkflows: GRPCUtils.ErrorUtils.handleStreamEndpointError(
    registerWorkflows,
  ),
};
