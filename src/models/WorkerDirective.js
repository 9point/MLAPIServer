const mongoose = require('mongoose');

const { ModelSchema, RefSchema } = require('./schemas');

const Schema = new mongoose.Schema({
  directiveType: Number,
  payload: String,
  payloadKey: String,
  workerRef: RefSchema,
});

Schema.add(ModelSchema);

const Model = mongoose.model('WorkerDirective', Schema);

Model.build = function build(directiveType, workerID, payloadKey, payload) {
  const now = new Date();
  return new Model({
    __modelType__: 'WorkerDirective',
    __type__: 'Model',
    createdAt: now,
    directiveType,
    isDeleted: false,
    payload: JSON.stringify(payload),
    payloadKey,
    updatedAt: now,
    workerRef: {
      __type__: 'Ref',
      refID: workerID,
      refType: 'Worker',
    },
  });
};

module.exports = Model;
