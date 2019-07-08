const grpc = require('grpc');

const server = new grpc.Server();

export function GRPC() {
  return function(klass: Function) {
    const serviceName = klass.name;
    Object.keys(klass.prototype).forEach(methodName => {
      const methodPath = `/${serviceName}/${methodName}`;
      server.addService(
        {
          [methodPath]: {
            originalName: methodName,
            path: methodPath,
            requestStream: false,
            responseStream: false,
            requestSerialize: serializeJson,
            requestDeserialize: deserializeJson,
            responseSerialize: serializeJson,
            responseDeserialize: deserializeJson
          }
        },
        {
          [methodPath](call: any, cb: any) {
            klass.prototype[methodName].apply(klass.prototype, call.request).then((result: any) => {
              cb(null, result);
            });
          }
        }
      );
    });
  };
}

const serializeJson = (obj: any) => {
  return new Buffer(JSON.stringify(obj));
};

const deserializeJson = (buffer: Buffer) => {
  if (buffer === undefined || buffer === null) {
    return buffer;
  }
  return JSON.parse(buffer.toString());
};

export const listen = (address: string, port: number) => {
  server.bind(address + ':' + port, grpc.ServerCredentials.createInsecure());
  server.start();
};
