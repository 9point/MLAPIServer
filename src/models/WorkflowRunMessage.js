const mongoose = require('mongoose');

const { ModelSchema, RefSchema } = require('./schemas');

const Schema = new mongoose.Schema({
  payload: String,
  payloadKey: String,
  workflowRunRef: RefSchema,
});

Schema.add(ModelSchema);

module.exports = mongoose.model('WorkflowRunMessage', Schema);
