import { EndpointCall, EndpointCallback, EndpointCallWritable } from './types';

export function handleStreamError(
  stream: EndpointCallWritable,
  cb: EndpointCallback,
) {
  return (...args: any[]) => {
    // Endpoint may or may not be async. Need to handle both cases.
    let promise;
    try {
      // @ts-ignore
      promise = cb.apply(cb, args);
    } catch (error) {
      console.error(`Caught unhandled endpoint error: ${error}`);
      if (error.stack) {
        console.error(error.stack);
      }
      stream.end();
    }

    if (promise && typeof promise.catch === 'function') {
      // Assuming this is a promise.
      promise.catch((error: Error) => {
        console.error(`Caught unhandled endpoint error: ${error}`);
        if (error.stack) {
          console.error(error.stack);
        }
        stream.end();
      });
    }
  };
}

export function handleStreamEndpointError(
  streamEndpoint: (call: EndpointCallWritable) => void | Promise<void>,
) {
  return (call: EndpointCallWritable) => {
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

export function handleCallbackEndpointError(
  endpoint: (
    call: EndpointCall,
    callback: EndpointCallback,
  ) => void | Promise<void>,
) {
  return (call: EndpointCall, callback: EndpointCallback) => {
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
