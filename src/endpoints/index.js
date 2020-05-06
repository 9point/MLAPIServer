const GRPCUtils = require('../grpc-utils-DEPRECATED');

const getProject = require('./getProject');
const getWorkflow = require('./getWorkflow');
const registerProject = require('./registerProject-DEPRECATED');
const registerTasks = require('./registerTasks');
const registerWorker = require('./registerWorker');
const registerWorkflows = require('./registerWorkflows');
const routeWorkerDirectives = require('./routeWorkerDirectives');
const runWorkflow = require('./runWorkflow');

// prettier-ignore

module.exports = {
  getProject: GRPCUtils.ErrorUtils.handleCallbackEndpointError(getProject),
  getWorkflow: GRPCUtils.ErrorUtils.handleCallbackEndpointError(getWorkflow),
  registerProject: GRPCUtils.ErrorUtils.handleCallbackEndpointError(registerProject),
  registerTasks: GRPCUtils.ErrorUtils.handleStreamEndpointError(registerTasks),
  registerWorker: GRPCUtils.ErrorUtils.handleCallbackEndpointError(registerWorker),
  registerWorkflows: GRPCUtils.ErrorUtils.handleStreamEndpointError(registerWorkflows),
  routeWorkerDirectives: GRPCUtils.ErrorUtils.handleStreamEndpointError(routeWorkerDirectives),
  runWorkflow: GRPCUtils.ErrorUtils.handleCallbackEndpointError(runWorkflow),
};
