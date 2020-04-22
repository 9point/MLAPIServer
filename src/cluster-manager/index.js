const Templates = require('./templates');

const genRunWorkflow = require('./genRunWorkflow');

function config() {
  Templates.config();
}

module.exports = {
  config,
  genRunWorkflow,
};
