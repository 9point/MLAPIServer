const createModel = require('./createModel');
const createRef = require('./createRef');

const COLLECTION_NAME = 'Workers';
const MODEL_TYPE = 'Worker';

/**
 *
 * @param {Object} fields
 *   projectID: ID of the parent project.
 *   status: Status of the worker.
 */
function create(fields) {
  return createModel(MODEL_TYPE, {
    projectRef: createRef('Project', fields.projectID),
    status: fields.status,
  });
}

module.exports = {
  COLLECTION_NAME,
  MODEL_TYPE,
  create,
};
