const GRPCUtils = require('../grpc-utils');

// NOTE: This endpoint is stateful.

async function routeWorkerDirectives(call) {
  console.log('RouteWorkerDirectives: Calling');

  const intervalID = setInterval(() => {
    console.log('heartbeat');
  }, 2000);

  function onData(request) {
    console.log('RouteWorkerDirectives: Receiving Request');
    console.log('Sender:', request.getWorkerSenderId());
    console.log('Receiver:', request.getWorkerReceiverId());
  }

  function onEnd() {
    console.log('RouteWorkerDirectives: Closing');
    clearInterval(intervalID);
  }

  call.on('data', GRPCUtils.ErrorUtils.handleStreamError(call, onData));
  call.on('end', GRPCUtils.ErrorUtils.handleStreamError(call, onEnd));
}

module.exports = routeWorkerDirectives;
