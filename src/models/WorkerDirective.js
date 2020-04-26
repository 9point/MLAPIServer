const createModel = require('./createModel');
const createRef = require('./createRef');

const { v4: uuidv4 } = require('uuid');

const COLLECTION_NAME = 'WorkerDirectives';
const MODEL_TYPE = 'WorkerDirective';

/**
 *
 * @param {Object} fields
 *   directiveType: Indicates direction of communication.
 *   payload: Payload of the directive.
 *   payloadKey: The key associated with the payload.
 *   workerID: ID of the worker this directive is associated with.
 */
function create(fields) {
  return createModel(MODEL_TYPE, {
    directiveType: fields.directiveType,
    payload: fields.payload,
    payloadKey: fields.payloadKey,
    workerRef: createRef('Worker', fields.workerID),
  });
}

create.heartbeat = {
  checkPulse(config) {
    const { workerID } = config;

    return create({
      directiveType: 'TO_WORKER',
      payload: { id: uuidv4() },
      payloadKey: 'v1.heartbeat.check_pulse',
      workerID,
    });
  },
};

create.info = {
  requestStatus(config) {
    const { workerID } = config;

    return create({
      directiveType: 'TO_WORKER',
      payload: {},
      payloadKey: 'v1.info.check_status',
      workerID,
    });
  },
};

create.task = {
  requestStart(config) {
    const { projectID, taskName, workerID } = config;

    return create({
      directiveType: 'TO_WORKER',
      payload: { project_id: projectID, task_name: taskName },
      payloadKey: 'v1.task.request_start',
      workerID,
    });
  },
};

module.exports = {
  COLLECTION_NAME,
  MODEL_TYPE,
  create,
};
