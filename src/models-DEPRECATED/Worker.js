const GRPCMLMessages = require('../static_codegen/mlservice_pb');

const mongoose = require('mongoose');

const { ModelSchema, RefSchema } = require('./schemas');

const Schema = new mongoose.Schema({
  projectRef: RefSchema,
  status: Number,
});

Schema.add(ModelSchema);

const Model = mongoose.model('Worker', Schema);

Model.build = function build(config) {
  const { projectID } = config;

  const now = new Date();
  return new Model({
    __modelType__: 'Worker',
    __type__: 'Model',
    createdAt: now,
    isDeleted: false,
    projectRef: {
      __type__: 'Ref',
      refID: projectID,
      refType: 'Project',
    },
    status: GRPCMLMessages.Worker.Status.INITIALIZED,
    updatedAt: now,
  });
};

module.exports = Model;
