const createModel = require('./createModel');
const createRef = require('./createRef');

const COLLECTION_NAME = 'Workflows';
const MODEL_TYPE = 'Workflow';

/**
 *
 * @param {Object} fields
 *   name: Name of the workflow.
 *   projectID: ID of the parent project.
 *   taskIDs: IDs of the tasks that are part of this workflow.
 */
function create(fields) {
  return createModel(MODEL_TYPE, {
    name: fields.name,
    projectRef: createRef('Project', fields.projectID),
    taskRefs: fields.taskIDs.map((id) => createRef('Task', id)),
  });
}

module.exports = {
  COLLECTION_NAME,
  MODEL_TYPE,
  create,
};
