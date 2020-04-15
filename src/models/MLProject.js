const mongoose = require('mongoose');

const { ModelSchema } = require('./schemas');

const Schema = new mongoose.Schema({
  imageName: String,
  name: String,
});

Schema.add(ModelSchema);

module.exports = mongoose.model('MLProject', Schema);
