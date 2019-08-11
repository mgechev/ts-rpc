import { __decorate } from 'tslib';
import { BEFORE_APP_SERIALIZED } from '@angular/platform-server';
import { APP_ID, NgModule } from '@angular/core';
import { ɵescapeHtml } from '@angular/platform-browser';
import { DOCUMENT } from '@angular/common';
import { ɵTransferState } from 'ts-rpc-reflect';

var getCacheKey = function (className, propName, args) {
    return className + "#" + propName + "#" + JSON.stringify(args);
};
var ɵ0 = getCacheKey;
function serializeTransferStateFactory(doc, appId) {
    console.log('#######');
    return function () {
        console.log('Adding state to the DOM');
        var script = doc.createElement('script');
        script.id = appId + '-rpc';
        script.setAttribute('type', 'application/json');
        script.textContent = ɵescapeHtml(JSON.stringify(data));
        doc.body.appendChild(script);
    };
}
function getTransferStateDescriptors(klass) {
    var protoChain = [];
    var proto = klass.prototype;
    while (proto) {
        protoChain.push(proto);
        proto = Object.getPrototypeOf(proto);
    }
    var result = [];
    var descriptors = Object.getOwnPropertyDescriptors(klass.prototype);
    Object.keys(descriptors).forEach(function (name) {
        var exists = protoChain.some(function (proto) {
            var current = Object.getOwnPropertyDescriptor(proto, name);
            return current && current.value[ɵTransferState];
        });
        if (exists) {
            result.push(name);
        }
    });
    return result;
}
var data = {};
function wrapServices(providers) {
    providers.forEach(function (p) {
        if (!p.useClass) {
            return;
        }
        var provider = p;
        // if (provider.useClass instanceof Service) {
        //   return;
        // }
        var descriptors = getTransferStateDescriptors(provider.useClass);
        console.log('Decorating', descriptors.length, 'methods');
        var proto = provider.useClass.prototype;
        descriptors.forEach(function (propName) {
            console.log('Decorating method');
            var original = proto[propName];
            console.log(original.toString());
            if (proto[propName].__DECORATED__) {
                return;
            }
            proto[propName] = function () {
                console.log('Delegating to original');
                console.trace();
                var args = arguments;
                return original.apply(this, arguments).then(function (res) {
                    console.log('Setting state key');
                    data[getCacheKey(proto.constructor.name, propName, args)] = JSON.stringify(res);
                    return res;
                });
            };
            proto[propName].__DECORATED__ = true;
        });
    });
    return providers;
}
var TSRPCAngularModule = /** @class */ (function () {
    function TSRPCAngularModule() {
    }
    TSRPCAngularModule_1 = TSRPCAngularModule;
    TSRPCAngularModule.register = function () {
        var providers = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            providers[_i] = arguments[_i];
        }
        return {
            ngModule: TSRPCAngularModule_1,
            providers: [
                providers,
                {
                    provide: BEFORE_APP_SERIALIZED,
                    useFactory: serializeTransferStateFactory,
                    deps: [DOCUMENT, APP_ID],
                    multi: true
                }
            ]
        };
    };
    var TSRPCAngularModule_1;
    TSRPCAngularModule = TSRPCAngularModule_1 = __decorate([
        NgModule({})
    ], TSRPCAngularModule);
    return TSRPCAngularModule;
}());

export { TSRPCAngularModule, serializeTransferStateFactory, wrapServices, ɵ0 };
//# sourceMappingURL=ts-rpc-angular.js.map
