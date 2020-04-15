const mongoose = require('mongoose');

const { ModelSchema, RefSchema } = require('./schemas');

const Schema = new mongoose.Schema({
  name: String,
  projectRef: RefSchema,
  version: String,
});

Schema.add(ModelSchema);

module.exports = mongoose.model('MLTask', Schema);
