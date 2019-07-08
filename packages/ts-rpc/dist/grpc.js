"use strict";
var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
var __spread = (this && this.__spread) || function () {
    for (var ar = [], i = 0; i < arguments.length; i++) ar = ar.concat(__read(arguments[i]));
    return ar;
};
Object.defineProperty(exports, "__esModule", { value: true });
var getBody = function (args) {
    var encoder = new TextEncoder();
    var bin = encoder.encode(JSON.stringify(args));
    var res = [];
    var twoOnEight = Math.pow(2, 8) - 1;
    var len = bin.length;
    if (len >= Math.pow(2, 32)) {
        throw new Error('Cannot accept message longer than 2^32 - 1');
    }
    for (var i = 0; i < 4; i += 1) {
        res.unshift(((twoOnEight << (i * 8)) & len) >> (i * 8));
    }
    return new Blob([new Uint8Array(__spread([0], res, bin))]);
};
var parseResponse = function (arr) {
    var view = new Uint8Array(arr);
    var decoder = new TextDecoder();
    var res = decoder.decode(view.slice(5));
    return JSON.parse(res);
};
function grpcUnary(fetch, host, serviceName, 
// side-effect
_, methodName) {
    var args = [];
    for (var _i = 5; _i < arguments.length; _i++) {
        args[_i - 5] = arguments[_i];
    }
    var body = getBody(args);
    return fetch(host + "/" + serviceName + "/" + methodName, {
        method: 'POST',
        mode: 'cors',
        headers: {
            'content-type': 'application/grprc'
        },
        body: body
    })
        .then(function (response) { return response.arrayBuffer(); })
        .then(parseResponse);
}
exports.grpcUnary = grpcUnary;
//# sourceMappingURL=grpc.js.map