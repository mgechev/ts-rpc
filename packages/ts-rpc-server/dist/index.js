"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const grpc = require('grpc');
const server = new grpc.Server();
function GRPC() {
    return function (klass) {
        const serviceName = klass.name;
        Object.keys(klass.prototype).forEach(methodName => {
            const methodPath = `/${serviceName}/${methodName}`;
            server.addService({
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
            }, {
                [methodPath](call, cb) {
                    klass.prototype[methodName].apply(klass.prototype, call.request).then((result) => {
                        cb(null, result);
                    });
                }
            });
        });
    };
}
exports.GRPC = GRPC;
const serializeJson = (obj) => {
    return new Buffer(JSON.stringify(obj));
};
const deserializeJson = (buffer) => {
    if (buffer === undefined || buffer === null) {
        return buffer;
    }
    return JSON.parse(buffer.toString());
};
exports.listen = (address, port) => {
    server.bind(address + ':' + port, grpc.ServerCredentials.createInsecure());
    server.start();
};
//# sourceMappingURL=index.js.map