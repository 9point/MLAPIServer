const mongoose = require('mongoose');

module.exports.ModelSchema = new mongoose.Schema({
  __type__: String,
  __modelType__: String,
  createdAt: Date,
  isDeleted: Boolean,
  updatedAt: Date,
});

module.exports.RefSchema = new mongoose.Schema({
  __type__: String,
  refID: mongoose.Schema.Types.ObjectId,
  refType: String,
});
