const mongoose = require('mongoose');

module.exports.genConnect = function genConnect() {
  return new Promise((resolve, reject) => {
    mongoose.connection.once('error', (error) => {
      reject(error);
    });

    mongoose.connection.once('open', () => {
      resolve();
    });

    const MONGO_URL = process.env.MONGO_URL;
    const MONGO_DB = process.env.MONGO_DB;

    mongoose.connect(`${MONGO_URL}/${MONGO_DB}`, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
  });
};
