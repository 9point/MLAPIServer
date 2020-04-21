const mongoose = require('mongoose');

const { ModelSchema, RefSchema } = require('./schemas');

const Schema = new mongoose.Schema({
  isMutable: Boolean,
  name: String,
  projectRef: RefSchema,
  version: String,
});

Schema.add(ModelSchema);

module.exports = mongoose.model('Task', Schema);
