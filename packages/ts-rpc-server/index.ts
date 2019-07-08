const grpc = require('grpc');

import chalk from 'chalk';

const info = (msg: string) => console.info(chalk.gray(msg));
const success = (msg: string) => console.log(chalk.yellow(msg));

const server = new grpc.Server();

export function Service() {
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
            info(`Handling request ${methodPath}`);
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
  const socket = address + ':' + port;
  server.bind(socket, grpc.ServerCredentials.createInsecure());
  success(`Listening on ${socket}`)
  server.start();
};
