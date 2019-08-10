"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ts_rpc_client_1 = require("ts-rpc-client");
exports.ReadOnly = Symbol('ts-rpc-reflect.ReadOnly');
exports.rpc = () => new Error('Not implemented');
exports.Read = () => {
    return (_, __, descriptor) => {
        descriptor.value[exports.ReadOnly] = true;
        return descriptor;
    };
};
const baseFactory = (_) => {
    return function () { };
};
exports.serviceFactory = (declaration, fetch, host) => {
    const result = baseFactory(declaration);
    const descriptors = Object.getOwnPropertyDescriptors(declaration.prototype);
    const partialUnary = ts_rpc_client_1.grpcUnary.bind(null, fetch, host, declaration.name);
    Object.keys(descriptors).forEach(prop => {
        result.prototype[prop] = function () {
            const descriptor = descriptors[prop];
            let isReadOnly = false;
            if (descriptor[exports.ReadOnly]) {
                isReadOnly = true;
            }
            return partialUnary(isReadOnly, prop, ...arguments);
        };
    });
    return new result;
};
//# sourceMappingURL=index.js.map