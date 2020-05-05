const FirebaseAdmin = require('firebase-admin');

const { v4: uuidv4 } = require('uuid');

module.exports = function createModel(type, fields) {
  const now = new Date();
  const nowTs = FirebaseAdmin.firestore.Timestamp.fromDate(now);
  return {
    ...fields,
    createdAt: nowTs,
    id: uuidv4(),
    isDeleted: false,
    modelType: type,
    type: 'MODEL',
    updatedAt: nowTs,
  };
};
