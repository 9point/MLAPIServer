const GRPCUtils = require('../grpc-utils');

const registerProject = require('./registerProject');

module.exports = {
  registerProject: GRPCUtils.handleError(registerProject),
};
