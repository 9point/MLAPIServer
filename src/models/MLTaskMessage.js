const mongoose = require('mongoose');

const { ModelSchema, RefSchema } = require('./schema');

const Schema = new mongoose.Schema({
  payload: String,
  taskInstanceRef: RefSchema,
});

Schema.add(ModelSchema);

module.exports = mongoose.model('MLTaskMessage', Schema);
