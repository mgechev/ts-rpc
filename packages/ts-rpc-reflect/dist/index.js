"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ts_rpc_client_1 = require("ts-rpc-client");
exports.ɵReadOnly = Symbol('ts-rpc-reflect.ReadOnly');
exports.ɵMiddleware = Symbol('ts-rpc-reflect.Middleware');
exports.rpc = () => new Error('Not implemented');
exports.Middleware = (middleware) => {
    return (service, method, descriptor) => {
        descriptor.value[exports.ɵMiddleware] = descriptor.value[exports.ɵMiddleware] || {
            middlewares: [],
            service,
            method
        };
        descriptor.value[exports.ɵMiddleware].middlewares.push(middleware);
        return descriptor;
    };
};
exports.Read = () => {
    return (_, __, descriptor) => {
        descriptor.value[exports.ɵReadOnly] = true;
        return descriptor;
    };
};
const baseFactory = (_) => {
    return function () { };
};
const defaultConfig = {
    fetch: (typeof global !== 'undefined' ? global : window).fetch,
    host: (typeof location !== 'undefined') ? location.protocol + '//' + location.host + ':9211' : ''
};
exports.serviceFactory = (declaration, config = defaultConfig) => {
    const result = baseFactory(declaration);
    const descriptors = Object.getOwnPropertyDescriptors(declaration.prototype);
    const partialUnary = ts_rpc_client_1.grpcUnary.bind(null, config.fetch, config.host, declaration.name);
    const propsAssignment = {};
    Object.keys(descriptors).forEach(prop => {
        const descriptor = descriptors[prop];
        result.prototype[prop] = function () {
            const args = arguments;
            const execute = () => partialUnary(!!descriptor.value[exports.ɵReadOnly], prop, ...args);
            const middlewares = (descriptor.value[exports.ɵMiddleware] || {
                middlewares: []
            }).middlewares.slice();
            const invokeMiddlewares = (current, middlewares) => {
                if (current < 0) {
                    return execute();
                }
                return middlewares[current](declaration, prop, () => invokeMiddlewares(current - 1, middlewares), ...args);
            };
            return invokeMiddlewares(middlewares.length - 1, middlewares);
        };
    });
    const instance = new result();
    Object.keys(propsAssignment).forEach(prop => {
        instance[prop] = propsAssignment[prop];
    });
    return instance;
};
//# sourceMappingURL=index.js.map