const createModel = require('./createModel');
const createRef = require('./createRef');

const COLLECTION_NAME = 'WorkflowRuns';
const MODEL_TYPE = 'WorkflowRun';

/**
 *
 * @param {Object} fields
 *   workerID: ID of the worker this directive is associated with.
 */
function create(fields) {
  return createModel(MODEL_TYPE, {
    workflowRef: createRef('Workflow', fields.workflowID),
  });
}

module.exports = {
  COLLECTION_NAME,
  MODEL_TYPE,
  create,
};
