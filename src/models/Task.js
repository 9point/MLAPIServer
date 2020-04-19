const mongoose = require('mongoose');

const { ModelSchema, RefSchema } = require('./schemas');

const Schema = new mongoose.Schema({
  isMutable: Boolean,
  name: String,
  version: String,
  workflowRef: RefSchema,
});

Schema.add(ModelSchema);

module.exports = mongoose.model('Task', Schema);
