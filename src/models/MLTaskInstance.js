const mongoose = require('mongoose');

const { ModelSchema, RefSchema } = require('./schema');

const Schema = new mongoose.Schema({
  projectRef: RefSchema,
  status: String,
  taskRef: RefSchema,
});

Schema.add(ModelSchema);

module.exports = mongoose.model('MLTaskInstance', Schema);
