const createModel = require('./createModel');
const createRef = require('./createRef');

const COLLECTION_NAME = 'Workflows';
const MODEL_TYPE = 'Workflow';

/**
 *
 * @param {Object} fields
 *   name: Name of the workflow.
 *   projectID: ID of the parent project.
 */
function create(fields) {
  return createModel(MODEL_TYPE, {
    name: fields.name,
    projectRef: createRef('Project', fields.projectID),
  });
}

module.exports = {
  COLLECTION_NAME,
  MODEL_TYPE,
  create,
};
