const createModel = require('./createModel');
const createRef = require('./createRef');
const setModel = require('./setModel');

const COLLECTION_NAME = 'WorkflowRunStates';
const MODEL_TYPE = 'WorkflowRunState';

/**
 *
 * @param {Object} fields
 *   workflowRunID: ID of the workflow run this state is associated with.
 */
function create(fields) {
  return createModel(MODEL_TYPE, {
    activeTaskRefs: [],
    completedTaskRefs: [],
    workflowRunRef: createRef('WorkflowRun', fields.workflowRunID),
  });
}

/**
 * @param {WorkflowRunState} model - The original model.
 *
 * @param {Object} fields
 *  activeTaskIDs?: Set of refs for active tasks.
 *  completedTaskIDs?: Set of refs for completed tasks.
 */
function set(model, fields) {
  const finalFields = {};

  if (fields.activeTaskIDs) {
    finalFields.activeTaskRefs = fields.activeTaskIDs.map((id) =>
      createRef('Task', id),
    );
  }

  if (fields.completedTaskIDs) {
    finalFields.completedTaskRefs = fields.completedTaskIDs.map((id) =>
      createRef('Task', id),
    );
  }

  return setModel(model, finalFields);
}

function addActiveTaskIDs(model, ids) {
  const completedTaskIDs = model.completedTaskRefs
    .filter((ref) => !ids.includes(ref.refID))
    .map((ref) => ref.refID);

  const newIDs = ids.filter(
    (id) => !model.activeTaskRefs.some((ref) => ref.refID === id),
  );

  const activeTaskIDs = model.activeTaskRefs
    .map((ref) => ref.refID)
    .concat(newIDs);

  return set(model, { activeTaskIDs, completedTaskIDs });
}

function addCompletedTaskIDs(model, ids) {
  const activeTaskIDs = model.activeTaskRefs
    .filter((ref) => !ids.includes(ref.refID))
    .map((ref) => ref.refID);

  const newIDs = ids.filter(
    (id) => !model.completedTaskRefs.some((ref) => ref.refID === id),
  );

  const completedTaskIDs = model.completedTaskRefs
    .map((ref) => ref.refID)
    .concat(newIDs);

  return set(model, { activeTaskIDs, completedTaskIDs });
}

module.exports = {
  COLLECTION_NAME,
  MODEL_TYPE,
  addActiveTaskIDs,
  addCompletedTaskIDs,
  create,
  set,
};
