const DB = require('../db');
const GRPCUtils = require('../grpc-utils');
const WorkerDirective = require('../models/WorkerDirective');

const { v4: uuidv4 } = require('uuid');

// NOTE: This endpoint is stateful.

async function routeWorkerDirectives(call) {
  console.log('RouteWorkerDirectives: Calling');

  let workerID = null;
  let hearbeat = null;

  async function onData(request) {
    console.log('RouteWorkerDirectives: Receiving Request');

    const _workerID = request.getWorkerId();
    const payloadKey = request.getPayloadKey();
    const payload = JSON.parse(request.getPayload());

    if (!workerID) {
      // This is the first request.
      workerID = _workerID;
      hearbeat = createHeartbeat(call, workerID);
    }

    if (workerID !== _workerID) {
      throw Error('Receiving calls from multiple works on same connection.');
    }

    const directive = WorkerDirective.create({
      directiveType: 'TO_SERVER',
      payload,
      payloadKey,
      workerID,
    });

    await DB.genSetModel(WorkerDirective, directive);
  }

  function onEnd() {
    console.log('RouteWorkerDirectives: Closing');

    if (hearbeat) {
      hearbeat.stop();
    }
  }

  call.on('data', GRPCUtils.ErrorUtils.handleStreamError(call, onData));
  call.on('end', GRPCUtils.ErrorUtils.handleStreamError(call, onEnd));
}

function createHeartbeat(call, workerID) {
  const heartbeatInvervalMs = 30000;

  const intervalID = setInterval(pulse, heartbeatInvervalMs);
  call.on('data', GRPCUtils.ErrorUtils.handleStreamError(call, onData));

  async function pulse() {
    const directive = WorkerDirective.create({
      directiveType: 'TO_WORKER',
      payload: { id: uuidv4() },
      payloadKey: 'v1.heartbeat.check_pulse',
      workerID,
    });
    await DB.genSetModel(WorkerDirective, directive);

    const message = GRPCUtils.WorkerDirective.createMessage(directive);
    call.write(message);
  }

  function onData(request) {
    // TODO: Need to check that heartbeat is responded to.
  }

  function stop() {
    clearInterval(intervalID);
  }

  return { stop };
}

module.exports = routeWorkerDirectives;
