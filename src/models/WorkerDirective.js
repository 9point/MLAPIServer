const createModel = require('./createModel');
const createRef = require('./createRef');

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

module.exports = {
  COLLECTION_NAME,
  MODEL_TYPE,
  create,
};
