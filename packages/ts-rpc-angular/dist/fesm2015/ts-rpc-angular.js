import { __decorate } from 'tslib';
import { BEFORE_APP_SERIALIZED } from '@angular/platform-server';
import { APP_ID, NgModule } from '@angular/core';
import { ɵescapeHtml } from '@angular/platform-browser';
import { DOCUMENT } from '@angular/common';
import { ɵTransferState } from 'ts-rpc-reflect';

var TSRPCAngularModule_1;
const getCacheKey = (className, propName, args) => {
    return `${className}#${propName}#${JSON.stringify(args)}`;
};
const ɵ0 = getCacheKey;
function serializeTransferStateFactory(doc, appId) {
    console.log('#######');
    return function () {
        console.log('Adding state to the DOM');
        const script = doc.createElement('script');
        script.id = appId + '-rpc';
        script.setAttribute('type', 'application/json');
        script.textContent = ɵescapeHtml(JSON.stringify(data));
        doc.body.appendChild(script);
    };
}
function getTransferStateDescriptors(klass) {
    const protoChain = [];
    let proto = klass.prototype;
    while (proto) {
        protoChain.push(proto);
        proto = Object.getPrototypeOf(proto);
    }
    const result = [];
    const descriptors = Object.getOwnPropertyDescriptors(klass.prototype);
    Object.keys(descriptors).forEach(name => {
        const exists = protoChain.some(proto => {
            const current = Object.getOwnPropertyDescriptor(proto, name);
            return current && current.value[ɵTransferState];
        });
        if (exists) {
            result.push(name);
        }
    });
    return result;
}
const data = {};
function wrapServices(providers) {
    providers.forEach((p) => {
        if (!p.useClass) {
            return;
        }
        const provider = p;
        // if (provider.useClass instanceof Service) {
        //   return;
        // }
        const descriptors = getTransferStateDescriptors(provider.useClass);
        console.log('Decorating', descriptors.length, 'methods');
        const proto = provider.useClass.prototype;
        descriptors.forEach(propName => {
            console.log('Decorating method');
            const original = proto[propName];
            console.log(original.toString());
            if (proto[propName].__DECORATED__) {
                return;
            }
            proto[propName] = function () {
                console.log('Delegating to original');
                console.trace();
                const args = arguments;
                return original.apply(this, arguments).then((res) => {
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
let TSRPCAngularModule = TSRPCAngularModule_1 = class TSRPCAngularModule {
    static register(...providers) {
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
    }
};
TSRPCAngularModule = TSRPCAngularModule_1 = __decorate([
    NgModule({})
], TSRPCAngularModule);

export { TSRPCAngularModule, serializeTransferStateFactory, wrapServices, ɵ0 };
//# sourceMappingURL=ts-rpc-angular.js.map
