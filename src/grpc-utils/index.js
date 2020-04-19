const Project = require('./Project');
const Workflow = require('./Workflow');

function handleStreamError(streamEndpoint) {
  return (call) => {
    // Endpoint may or may not be async. Need to handle both cases.
    let promise;
    try {
      promise = streamEndpoint(call);
    } catch (error) {
      console.error(`Caught unhandled endpoint error: ${error}`);
      if (error.stack) {
        console.error(error.stack);
      }
      call.end();
    }

    if (promise && typeof promise.catch === 'function') {
      // Assuming this is a function.
      promise.catch((error) => {
        console.error(`Caught unhandled endpoint error: ${error}`);
        if (error.stack) {
          console.error(error.stack);
        }
        call.end();
      });
    }
  };
}

function handleError(endpoint) {
  return (call, callback) => {
    // Endpoint may or may not be async. Need to handle both cases.
    let promise;
    try {
      promise = endpoint(call, callback);
    } catch (error) {
      console.error(`Caught unhandled endpoint error: ${error}`);
      if (error.stack) {
        console.error(error.stack);
      }
      callback(error);
    }

    if (promise && typeof promise.catch === 'function') {
      // Assuming this is a function.
      promise.catch((error) => {
        console.error(`Caught unhandled endpoint error: ${error}`);
        if (error.stack) {
          console.error(error.stack);
        }
        callback(error);
      });
    }
  };
}

module.exports = {
  Project,
  Workflow,
  handleError,
  handleStreamError,
};
