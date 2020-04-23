const mongoose = require('mongoose');

const { ModelSchema, RefSchema } = require('./schemas');

const Schema = new mongoose.Schema({
  projectRef: RefSchema,
  status: Number,
});

Schema.add(ModelSchema);

module.exports = mongoose.model('Worker', Schema);
