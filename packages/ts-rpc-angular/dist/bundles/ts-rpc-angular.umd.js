(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('@angular/platform-server'), require('@angular/core'), require('@angular/platform-browser'), require('@angular/common'), require('ts-rpc-reflect')) :
    typeof define === 'function' && define.amd ? define('ts-rpc-angular', ['exports', '@angular/platform-server', '@angular/core', '@angular/platform-browser', '@angular/common', 'ts-rpc-reflect'], factory) :
    (global = global || self, factory(global['ts-rpc-angular'] = {}, global.ng['platform-server'], global.ng.core, global.ng.platformBrowser, global.ng.common, global.tsRpcReflect));
}(this, function (exports, platformServer, core, platformBrowser, common, tsRpcReflect) { 'use strict';

    /*! *****************************************************************************
    Copyright (c) Microsoft Corporation. All rights reserved.
    Licensed under the Apache License, Version 2.0 (the "License"); you may not use
    this file except in compliance with the License. You may obtain a copy of the
    License at http://www.apache.org/licenses/LICENSE-2.0

    THIS CODE IS PROVIDED ON AN *AS IS* BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
    KIND, EITHER EXPRESS OR IMPLIED, INCLUDING WITHOUT LIMITATION ANY IMPLIED
    WARRANTIES OR CONDITIONS OF TITLE, FITNESS FOR A PARTICULAR PURPOSE,
    MERCHANTABLITY OR NON-INFRINGEMENT.

    See the Apache Version 2.0 License for specific language governing permissions
    and limitations under the License.
    ***************************************************************************** */

    function __decorate(decorators, target, key, desc) {
        var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
        if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
        else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
        return c > 3 && r && Object.defineProperty(target, key, r), r;
    }

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
            script.textContent = platformBrowser.ɵescapeHtml(JSON.stringify(data));
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
                return current && current.value[tsRpcReflect.ɵTransferState];
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
                        provide: platformServer.BEFORE_APP_SERIALIZED,
                        useFactory: serializeTransferStateFactory,
                        deps: [common.DOCUMENT, core.APP_ID],
                        multi: true
                    }
                ]
            };
        };
        var TSRPCAngularModule_1;
        TSRPCAngularModule = TSRPCAngularModule_1 = __decorate([
            core.NgModule({})
        ], TSRPCAngularModule);
        return TSRPCAngularModule;
    }());

    exports.TSRPCAngularModule = TSRPCAngularModule;
    exports.serializeTransferStateFactory = serializeTransferStateFactory;
    exports.wrapServices = wrapServices;
    exports.ɵ0 = ɵ0;

    Object.defineProperty(exports, '__esModule', { value: true });

}));
//# sourceMappingURL=ts-rpc-angular.umd.js.map
