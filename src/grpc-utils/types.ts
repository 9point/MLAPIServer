export type Message = any;

export interface EndpointCall {
  request: Message;
}

export interface EndpointCallWritable extends NodeJS.WritableStream {
  request: Message;
}

export type EndpointCallback<TMessage = Message> = (
  error: Error | null | undefined,
  message: TMessage,
) => void;
