// GENERATED CODE -- DO NOT EDIT!

'use strict';
var grpc = require('grpc');
var mlservice_pb = require('./mlservice_pb.js');
var google_protobuf_timestamp_pb = require('google-protobuf/google/protobuf/timestamp_pb.js');

function serialize_Obj_MLProject(arg) {
  if (!(arg instanceof mlservice_pb.Obj_MLProject)) {
    throw new Error('Expected argument of type Obj_MLProject');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_Obj_MLProject(buffer_arg) {
  return mlservice_pb.Obj_MLProject.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_Obj_MLTask(arg) {
  if (!(arg instanceof mlservice_pb.Obj_MLTask)) {
    throw new Error('Expected argument of type Obj_MLTask');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_Obj_MLTask(buffer_arg) {
  return mlservice_pb.Obj_MLTask.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_Obj_MLTaskInstance(arg) {
  if (!(arg instanceof mlservice_pb.Obj_MLTaskInstance)) {
    throw new Error('Expected argument of type Obj_MLTaskInstance');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_Obj_MLTaskInstance(buffer_arg) {
  return mlservice_pb.Obj_MLTaskInstance.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_Obj_MLTaskInstanceMessage(arg) {
  if (!(arg instanceof mlservice_pb.Obj_MLTaskInstanceMessage)) {
    throw new Error('Expected argument of type Obj_MLTaskInstanceMessage');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_Obj_MLTaskInstanceMessage(buffer_arg) {
  return mlservice_pb.Obj_MLTaskInstanceMessage.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_Req_MLProjects(arg) {
  if (!(arg instanceof mlservice_pb.Req_MLProjects)) {
    throw new Error('Expected argument of type Req_MLProjects');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_Req_MLProjects(buffer_arg) {
  return mlservice_pb.Req_MLProjects.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_Req_MLTaskInstanceMessagesForTaskInstance(arg) {
  if (!(arg instanceof mlservice_pb.Req_MLTaskInstanceMessagesForTaskInstance)) {
    throw new Error('Expected argument of type Req_MLTaskInstanceMessagesForTaskInstance');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_Req_MLTaskInstanceMessagesForTaskInstance(buffer_arg) {
  return mlservice_pb.Req_MLTaskInstanceMessagesForTaskInstance.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_Req_MLTaskInstancesForTask(arg) {
  if (!(arg instanceof mlservice_pb.Req_MLTaskInstancesForTask)) {
    throw new Error('Expected argument of type Req_MLTaskInstancesForTask');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_Req_MLTaskInstancesForTask(buffer_arg) {
  return mlservice_pb.Req_MLTaskInstancesForTask.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_Req_MLTasksForProject(arg) {
  if (!(arg instanceof mlservice_pb.Req_MLTasksForProject)) {
    throw new Error('Expected argument of type Req_MLTasksForProject');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_Req_MLTasksForProject(buffer_arg) {
  return mlservice_pb.Req_MLTasksForProject.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_Req_StartMLTask(arg) {
  if (!(arg instanceof mlservice_pb.Req_StartMLTask)) {
    throw new Error('Expected argument of type Req_StartMLTask');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_Req_StartMLTask(buffer_arg) {
  return mlservice_pb.Req_StartMLTask.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_Stub_MLProject(arg) {
  if (!(arg instanceof mlservice_pb.Stub_MLProject)) {
    throw new Error('Expected argument of type Stub_MLProject');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_Stub_MLProject(buffer_arg) {
  return mlservice_pb.Stub_MLProject.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_Stub_MLTask(arg) {
  if (!(arg instanceof mlservice_pb.Stub_MLTask)) {
    throw new Error('Expected argument of type Stub_MLTask');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_Stub_MLTask(buffer_arg) {
  return mlservice_pb.Stub_MLTask.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_Stub_MLTaskInstanceMessage(arg) {
  if (!(arg instanceof mlservice_pb.Stub_MLTaskInstanceMessage)) {
    throw new Error('Expected argument of type Stub_MLTaskInstanceMessage');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_Stub_MLTaskInstanceMessage(buffer_arg) {
  return mlservice_pb.Stub_MLTaskInstanceMessage.deserializeBinary(new Uint8Array(buffer_arg));
}


var MLServiceService = exports.MLServiceService = {
  getProjects: {
    path: '/MLService/GetProjects',
    requestStream: false,
    responseStream: true,
    requestType: mlservice_pb.Req_MLProjects,
    responseType: mlservice_pb.Obj_MLProject,
    requestSerialize: serialize_Req_MLProjects,
    requestDeserialize: deserialize_Req_MLProjects,
    responseSerialize: serialize_Obj_MLProject,
    responseDeserialize: deserialize_Obj_MLProject,
  },
  getTasksForProject: {
    path: '/MLService/GetTasksForProject',
    requestStream: false,
    responseStream: true,
    requestType: mlservice_pb.Req_MLTasksForProject,
    responseType: mlservice_pb.Obj_MLTask,
    requestSerialize: serialize_Req_MLTasksForProject,
    requestDeserialize: deserialize_Req_MLTasksForProject,
    responseSerialize: serialize_Obj_MLTask,
    responseDeserialize: deserialize_Obj_MLTask,
  },
  getTaskInstancesForTask: {
    path: '/MLService/GetTaskInstancesForTask',
    requestStream: false,
    responseStream: true,
    requestType: mlservice_pb.Req_MLTaskInstancesForTask,
    responseType: mlservice_pb.Obj_MLTaskInstance,
    requestSerialize: serialize_Req_MLTaskInstancesForTask,
    requestDeserialize: deserialize_Req_MLTaskInstancesForTask,
    responseSerialize: serialize_Obj_MLTaskInstance,
    responseDeserialize: deserialize_Obj_MLTaskInstance,
  },
  getTaskInstancesMessagesForTaskInstance: {
    path: '/MLService/GetTaskInstancesMessagesForTaskInstance',
    requestStream: false,
    responseStream: true,
    requestType: mlservice_pb.Req_MLTaskInstanceMessagesForTaskInstance,
    responseType: mlservice_pb.Obj_MLTaskInstanceMessage,
    requestSerialize: serialize_Req_MLTaskInstanceMessagesForTaskInstance,
    requestDeserialize: deserialize_Req_MLTaskInstanceMessagesForTaskInstance,
    responseSerialize: serialize_Obj_MLTaskInstanceMessage,
    responseDeserialize: deserialize_Obj_MLTaskInstanceMessage,
  },
  createMLProject: {
    path: '/MLService/CreateMLProject',
    requestStream: false,
    responseStream: false,
    requestType: mlservice_pb.Stub_MLProject,
    responseType: mlservice_pb.Obj_MLProject,
    requestSerialize: serialize_Stub_MLProject,
    requestDeserialize: deserialize_Stub_MLProject,
    responseSerialize: serialize_Obj_MLProject,
    responseDeserialize: deserialize_Obj_MLProject,
  },
  createMLTask: {
    path: '/MLService/CreateMLTask',
    requestStream: false,
    responseStream: false,
    requestType: mlservice_pb.Stub_MLTask,
    responseType: mlservice_pb.Obj_MLTask,
    requestSerialize: serialize_Stub_MLTask,
    requestDeserialize: deserialize_Stub_MLTask,
    responseSerialize: serialize_Obj_MLTask,
    responseDeserialize: deserialize_Obj_MLTask,
  },
  createMLTaskInstanceMessage: {
    path: '/MLService/CreateMLTaskInstanceMessage',
    requestStream: false,
    responseStream: false,
    requestType: mlservice_pb.Stub_MLTaskInstanceMessage,
    responseType: mlservice_pb.Obj_MLTaskInstanceMessage,
    requestSerialize: serialize_Stub_MLTaskInstanceMessage,
    requestDeserialize: deserialize_Stub_MLTaskInstanceMessage,
    responseSerialize: serialize_Obj_MLTaskInstanceMessage,
    responseDeserialize: deserialize_Obj_MLTaskInstanceMessage,
  },
  startMLTask: {
    path: '/MLService/StartMLTask',
    requestStream: false,
    responseStream: false,
    requestType: mlservice_pb.Req_StartMLTask,
    responseType: mlservice_pb.Obj_MLTaskInstance,
    requestSerialize: serialize_Req_StartMLTask,
    requestDeserialize: deserialize_Req_StartMLTask,
    responseSerialize: serialize_Obj_MLTaskInstance,
    responseDeserialize: deserialize_Obj_MLTaskInstance,
  },
};

exports.MLServiceClient = grpc.makeGenericClientConstructor(MLServiceService);
