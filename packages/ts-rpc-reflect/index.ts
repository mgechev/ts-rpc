import { grpcUnary, FetchFn } from 'ts-rpc-client';

export const ɵReadOnly = Symbol('ts-rpc-reflect.ReadOnly');
export const ɵTransferState = Symbol('ts-rpc-reflect.TransferState');

export const rpc = (): any => new Error('Not implemented');

export const Read = () => {
  return (_: any, __: string, descriptor: PropertyDescriptor) => {
    descriptor.value[ɵReadOnly] = true;
    return descriptor;
  };
};

export const TransferState = (prop: string) => {
  return (_: any, __: string, descriptor: PropertyDescriptor) => {
    descriptor.value[ɵTransferState] = {
      prop
    };
    return descriptor;
  };
};

const baseFactory = <T extends Function>(_: T): T => {
  return (function() {} as unknown) as T;
};

interface Constructable<T> {
  new (...args: any[]): T;
}

export interface Config {
  fetch: FetchFn;
  host: string;
  transferId: string;
}

export function unescapeHtml(text: string): string {
  const unescapedText: {[k: string]: string} = {
    '&a;': '&',
    '&q;': '"',
    '&s;': '\'',
    '&l;': '<',
    '&g;': '>',
  };
  return text.replace(/&[^;]+;/g, s => unescapedText[s]);
}

export const serviceFactory = <T extends Function>(
  declaration: T,
  config: Config
): T => {
  const result = baseFactory(declaration);
  const descriptors = Object.getOwnPropertyDescriptors(declaration.prototype);
  const partialUnary = grpcUnary.bind(
    null,
    config.fetch,
    config.host,
    declaration.name
  );
  const propsAssignment: {[prop: string]: string} = {};
  Object.keys(descriptors).forEach(prop => {
    const descriptor = descriptors[prop];
    const transferState = (descriptor.value as any)[ɵTransferState] as
      | { prop: string }
      | undefined;
    if (transferState) {
      const stateContainer = document.getElementById(config.transferId);
      if (stateContainer) {
        propsAssignment[transferState.prop] = JSON.parse(JSON.parse(unescapeHtml(stateContainer.innerText))[
          declaration.name + '#' + prop + '#{}'
        ]);
      }
    }
    result.prototype[prop] = function() {
      let isReadOnly = false;
      if ((descriptor.value as any)[ɵReadOnly]) {
        isReadOnly = true;
      }
      return partialUnary(isReadOnly, prop, ...arguments);
    };
  });
  const instance = new ((result as unknown) as Constructable<T>)();
  Object.keys(propsAssignment).forEach(prop => {
    (instance as any)[prop] = propsAssignment[prop];
  })
  return instance;
};
