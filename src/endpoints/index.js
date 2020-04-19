const GRPCUtils = require('../grpc-utils');

const registerProject = require('./registerProject');
const registerWorkflows = require('./registerWorkflows')

module.exports = {
  registerProject: GRPCUtils.handleError(registerProject),
  registerWorkflows: GRPCUtils.handleStreamError(registerWorkflows),
};
