const FirebaseAdmin = require('firebase-admin');

const assert = require('assert');

module.exports = function setModel(model, fields) {
  assert(Object.keys(fields) > 0, 'Cannot set model with no new fields.');
  const now = new Date();
  const nowTs = FirebaseAdmin.firestore.Timestamp.fromDate(now);

  return {
    ...fields,
    ...model,
    updatedAt: nowTs,
  };
};
