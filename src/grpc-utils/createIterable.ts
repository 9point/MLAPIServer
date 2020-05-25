import assert from 'assert';

import { EndpointCallWritable, Message } from './types';

// Can find AsyncIterator definition here:
// https://github.com/microsoft/TypeScript/blob/master/src/lib/es2018.asynciterable.d.ts#L3
export interface GRPCIterable extends AsyncIterable<Message> {
  close: () => void;
}

type GRPCIterator = AsyncIterator<Message>;

type GRPCIteratorResult = IteratorResult<Message>;

type IterableOneTimeListenerCallback = (
  error: Error | undefined,
  result: GRPCIteratorResult,
) => void;

interface IterableOneTimeListener {
  cb: IterableOneTimeListenerCallback;
  handle: string;
}

// NOTE: This iterable always starts iteration at the beginning of the
// set of messages.
export default function createIteratable(
  call: EndpointCallWritable,
): GRPCIterable {
  const messages: Message[] = [];
  const listeners: IterableOneTimeListener[] = [];

  let didEnd: boolean = false;
  let nextHandle: number = 1;
  const handleToIndex: { [handle: string]: number } = {};

  const createHandle = () => {
    const handle = String(nextHandle);
    nextHandle += 1;
    handleToIndex[handle] = 0;
    return handle;
  };

  const listenNext = (
    handle: string,
    cb: (error: Error | undefined, result: GRPCIteratorResult) => void,
  ) => {
    const idx = handleToIndex[handle];
    assert(idx !== undefined);

    // Check to see if the next message is immediately available.
    if (messages.length > idx) {
      handleToIndex[handle] += 1;
      return cb(undefined, { done: false, value: messages[idx] });
    }

    // Check if we finished sending messages.
    if (didEnd) {
      return cb(undefined, { done: true, value: undefined });
    }

    listeners.push({ handle, cb });
  };

  const returnIterable = (handle: string) => {
    // Remove all listeners for this handle.
    const indicesToRemove: number[] = [];
    for (let i = 0; i < listeners.length; ++i) {
      if (listeners[i].handle === handle) {
        indicesToRemove.push(i);
      }
    }

    for (const i of indicesToRemove) {
      listeners.splice(i, 1);
    }

    // Delete the handle.
    delete handleToIndex[handle];
  };

  const onData = (message: Message) => {
    assert(!didEnd);

    messages.push(message);

    // These are one-time listeners that need to get removed after they
    // are called. However, when executing the callbacks on the listeners, it
    // is possible that more listeners will be added synchronously. So we need
    // to keep track of how many listeners exist before executing the callbacks,
    // so we can remove the old listeners and retain the new ones.
    const listenerCount = listeners.length;

    for (const listener of listeners) {
      const { cb, handle } = listener;

      const idx = handleToIndex[handle];
      assert(idx === messages.length - 1);

      handleToIndex[handle] += 1;
      // TODO: Need to handle errors in the callback.
      cb(undefined, { done: false, value: messages[idx] });
    }

    // Remove the listeners that were called.
    listeners.splice(0, listenerCount);
  };

  const onEnd = () => {
    call.off('data', onData);
    call.off('end', onEnd);

    didEnd = true;

    for (const listener of listeners) {
      const { cb, handle } = listener;

      const idx = handleToIndex[handle];
      assert(idx === messages.length);
      cb(undefined, { done: true, value: undefined });
    }

    listeners.splice(0, listeners.length);

    call.end();
  };

  call.on('data', onData);

  call.on('end', onEnd);

  return {
    [Symbol.asyncIterator]: () => {
      const handle = createHandle();
      return createIterator(
        listenNext.bind(null, handle),
        returnIterable.bind(null, handle),
      );
    },

    close: onEnd,
  };
}

function createIterator(
  listenNext: (cb: IterableOneTimeListenerCallback) => void,
  onReturn: () => void,
): GRPCIterator {
  const next = (): Promise<GRPCIteratorResult> =>
    new Promise((resolve, reject) =>
      listenNext((error, result) => {
        if (error) {
          return reject(error);
        }
        resolve(result);
      }),
    );

  const _return = (): Promise<GRPCIteratorResult> => {
    console.log('calling return');
    onReturn();
    return Promise.resolve({ done: true, value: undefined });
  };

  return { next, return: _return };
}
