"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ts_rpc_client_1 = require("ts-rpc-client");
exports.ɵReadOnly = Symbol('ts-rpc-reflect.ReadOnly');
exports.ɵTransferState = Symbol('ts-rpc-reflect.TransferState');
exports.rpc = () => new Error('Not implemented');
exports.Read = () => {
    return (_, __, descriptor) => {
        descriptor.value[exports.ɵReadOnly] = true;
        return descriptor;
    };
};
exports.TransferState = (prop) => {
    return (_, __, descriptor) => {
        descriptor.value[exports.ɵTransferState] = {
            prop
        };
        return descriptor;
    };
};
const baseFactory = (_) => {
    return function () { };
};
function unescapeHtml(text) {
    const unescapedText = {
        '&a;': '&',
        '&q;': '"',
        '&s;': '\'',
        '&l;': '<',
        '&g;': '>',
    };
    return text.replace(/&[^;]+;/g, s => unescapedText[s]);
}
exports.unescapeHtml = unescapeHtml;
exports.serviceFactory = (declaration, config) => {
    const result = baseFactory(declaration);
    const descriptors = Object.getOwnPropertyDescriptors(declaration.prototype);
    const partialUnary = ts_rpc_client_1.grpcUnary.bind(null, config.fetch, config.host, declaration.name);
    const propsAssignment = {};
    Object.keys(descriptors).forEach(prop => {
        const descriptor = descriptors[prop];
        const transferState = descriptor.value[exports.ɵTransferState];
        if (transferState) {
            const stateContainer = document.getElementById(config.transferId);
            if (stateContainer) {
                propsAssignment[transferState.prop] = JSON.parse(JSON.parse(unescapeHtml(stateContainer.innerText))[declaration.name + '#' + prop + '#{}']);
            }
        }
        result.prototype[prop] = function () {
            let isReadOnly = false;
            if (descriptor.value[exports.ɵReadOnly]) {
                isReadOnly = true;
            }
            return partialUnary(isReadOnly, prop, ...arguments);
        };
    });
    const instance = new result();
    Object.keys(propsAssignment).forEach(prop => {
        instance[prop] = propsAssignment[prop];
    });
    return instance;
};
//# sourceMappingURL=index.js.map