import { BEFORE_APP_SERIALIZED } from '@angular/platform-server';
import { NgModule, APP_ID, Provider, ClassProvider, ModuleWithProviders } from '@angular/core';
import {
  ɵescapeHtml as escapeHtml,
} from '@angular/platform-browser';
import { DOCUMENT } from '@angular/common';
import { ɵTransferState } from 'ts-rpc-reflect';

const getCacheKey = (className: string, propName: string, args: any) => {
  return `${className}#${propName}#${JSON.stringify(args)}`;
};

export function serializeTransferStateFactory(
  doc: Document,
  appId: string,
) {
  return function () {
    console.log('Adding state to the DOM');
    const script = doc.createElement('script');
    script.id = appId + '-rpc';
    script.setAttribute('type', 'application/json');
    script.textContent = escapeHtml(JSON.stringify(data));
    doc.body.appendChild(script);
  };
}

function getTransferStateDescriptors(klass: Function) {
  const protoChain: Object[] = [];
  let proto = klass.prototype;
  while (proto) {
    protoChain.push(proto);
    proto = Object.getPrototypeOf(proto);
  }
  const result: string[] = [];
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
};

const data: { [key: string]: string } = {};

export function wrapServices(providers: Provider[]): any {
  providers.forEach((p: Provider) => {
    if (!(p as ClassProvider).useClass) {
      return;
    }
    const provider = p as ClassProvider;
    // if (provider.useClass instanceof Service) {
    //   return;
    // }

    const descriptors = getTransferStateDescriptors(provider.useClass);

    console.log('Decorating', descriptors.length, 'methods');
    const proto = provider.useClass.prototype;
    descriptors.forEach(propName => {
      console.log('Decorating method');
      const original = proto[propName] as Function;
      console.log(original.toString());
      if (proto[propName].__DECORATED__) {
        return;
      }
      proto[propName] = function() {
        console.log('Delegating to original');
        console.trace();
        const args = arguments;
        return original.apply(this, arguments).then((res: any) => {
          console.log('Setting state key');
          data[getCacheKey(proto.constructor.name, propName, args)] = JSON.stringify(res);
          return res;
        });
      };
      proto[propName].__DECORATED__ = true;
    });
  });
  return providers;
};

@NgModule({})
export class TSRPCAngularModule {
  static register(...providers: Provider[]): ModuleWithProviders {
    return {
      ngModule: TSRPCAngularModule,
      providers: [
        providers,
        {
          provide: BEFORE_APP_SERIALIZED,
          useFactory: serializeTransferStateFactory,
          deps: [DOCUMENT, APP_ID],
          multi: true
        }
      ]
    }
  }
}
