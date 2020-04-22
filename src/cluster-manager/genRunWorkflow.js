const Project = require('../models/Project');
const Templates = require('./templates');
const Workflow = require('../models/Workflow');
const WorkflowRun = require('../models/WorkflowRun');
const WorkflowRunMessage = require('../models/WorkflowRunMessage');

async function genRunWorkflow(workflow) {
  const project = await Project.findById(workflow.projectRef.refID);

  if (!project) {
    throw Error(
      `Could not find project for workflow: ${workflow._id.toString()}`,
    );
  }

  // Create and persist workflow run.

  let now = new Date();
  const run = new WorkflowRun({
    __modelType__: 'WorkflowRun',
    __type__: 'Model',
    createdAt: now,
    updatedAt: now,
    workflowRef: {
      __type__: 'Ref',
      refID: workflow._id.toString(),
      refType: 'Workflow',
    },
  });

  await run.save();

  // Deploy job.

  const kubeJobConfig = {
    command: ['python', './main.py', 'run', workflow.name],
    env: [
      {
        name: 'API_ENDPOINT',
        value: 'localhost:50051',
      },
      {
        name: 'LOCAL_CACHE_DIR',
        value: '/tmp/s3-cache',
      },
      {
        name: 'PROJECT_NAME',
        value: project.name,
      },
      {
        name: 'IMAGE_NAME',
        value: project.imageName,
      },
      {
        name: 'RUN_ID',
        value: run._id.toString(),
      },
    ],
    id: run._id.toString(),
    imageName: project.imageName,
    projectName: project.name,
  };

  const configFilepath = await Templates.genJob(kubeJobConfig);
  // TODO: Finish implement me! Need to make a call to kubernetes.

  // Create and persist initialization message.

  now = new Date();
  const message = new WorkflowRunMessage({
    __modelType__: 'WorkflowRunMessage',
    __type__: 'Model',
    createdAt: now,
    payload: JSON.stringify({}),
    payloadKey: 'v0.service.initialized',
    updatedAt: now,
    workflowRunRef: {
      __type__: 'Ref',
      refID: run._id.toString(),
      refType: 'WorkflowRun',
    },
  });

  await message.save();
}

module.exports = genRunWorkflow;
