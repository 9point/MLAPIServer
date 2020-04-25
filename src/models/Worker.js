const createModel = require('./createModel');
const createRef = require('./createRef');
const setModel = require('./setModel');

const COLLECTION_NAME = 'Workers';
const MODEL_TYPE = 'Worker';

/**
 *
 * @param {Object} fields
 *   projectID: ID of the parent project.
 *   status: Status of the worker. Default is INITIALIZING.
 */
function create(fields) {
  return createModel(MODEL_TYPE, {
    projectRef: createRef('Project', fields.projectID),
    status: fields.status || 'INITIALIZING',
  });
}

/**
 *
 * @param {Object} fields
 *   status: The status of the worker.
 */
function set(model, fields) {
  return setModel(model, fields);
}

module.exports = {
  COLLECTION_NAME,
  MODEL_TYPE,
  create,
  set,
};
