const mongoose = require('mongoose');

const { ModelSchema, RefSchema } = require('./schemas');

const Schema = new mongoose.Schema({
  name: String,
  projectRef: RefSchema,
});

Schema.add(ModelSchema);

module.exports = mongoose.model('Workflow', Schema);
