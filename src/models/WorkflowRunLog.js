const mongoose = require('mongoose');

const { ModelSchema, RefSchema } = require('./schemas');

const Schema = new mongoose.Schema({
  jobInstanceID: String,
  payload: String,
  payloadKey: String,
  workflowRunRef: RefSchema,
});

Schema.add(ModelSchema);

module.exports = mongoose.model('WorkflowRunLog', Schema);
