const createModel = require('./createModel');

const COLLECTION_NAME = 'Projects';
const MODEL_TYPE = 'Project';

/**
 *
 * @param {Object} fields
 *   imageName - name of the docker image.
 *   name - Name of the project.
 */
function create(fields) {
  return createModel(MODEL_TYPE, fields);
}

module.exports = {
  COLLECTION_NAME,
  MODEL_TYPE,
  create,
};
