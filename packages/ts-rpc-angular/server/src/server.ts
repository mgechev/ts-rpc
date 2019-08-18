import { BEFORE_APP_SERIALIZED } from '@angular/platform-server';
import {
  NgModule,
  APP_ID,
  Provider,
  ClassProvider,
  ModuleWithProviders
} from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { ɵescapeHtml as escapeHtml } from '@angular/platform-browser';
import { getCacheKey } from './cache';

const data: { [key: string]: string } = {};

export function serializeTransferStateFactory(doc: Document, appId: string) {
  // Workaround Angular compiler issue
  void 0;
  return function() {
    console.log('Adding state to the DOM');
    const script = doc.createElement('script');
    script.id = appId;
    script.setAttribute('type', 'application/json');
    script.textContent = escapeHtml(JSON.stringify(data));
    doc.body.appendChild(script);
  };
}

export function wrapServices(providers: Provider[]): any {
  providers.forEach((p: Provider) => {
    if (!(p as ClassProvider).useClass) {
      return;
    }
    const provider = p as ClassProvider;

    const descriptors = Object.keys(
      Object.getOwnPropertyDescriptors(provider.useClass.prototype)
    );

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
        const args = [...arguments];
        return original.apply(this, args).then((res: any) => {
          console.log('Setting state key');
          data[
            getCacheKey(provider.useClass.name, propName, args)
          ] = JSON.stringify(res);
          return res;
        });
      };
      proto[propName].__DECORATED__ = true;
    });
  });
  return providers;
}

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
    };
  }
}
