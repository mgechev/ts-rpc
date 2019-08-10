import { grpcUnary, FetchFn } from 'ts-rpc-client';

export const readOnly = Symbol('ts-rpc-reflect.readonly');

export const Read = () => {
  return (_: any, __: string, descriptor: PropertyDescriptor) => {
    descriptor.value[readOnly] = true;
    return descriptor;
  };
};

const baseFactory = <T extends Function>(_: T): T => {
  return function () {} as unknown as T;
};

interface Constructable<T> {
  new (...args:any[]): T;
}

export const serviceFactory = <T extends Function>(declaration: T, fetch: FetchFn, host: string): T => {
  const result = baseFactory(declaration);
  const descriptors = Object.getOwnPropertyDescriptors(declaration.prototype);
  const partialUnary = grpcUnary.bind(null, fetch, host, declaration.name);
  Object.keys(descriptors).forEach(prop => {
    result.prototype[prop] = function() {
      const descriptor = descriptors[prop];
      let isReadOnly = false;
      if ((descriptor as any)[readOnly]) {
        isReadOnly = true;
      }
      return partialUnary(isReadOnly, prop, ...arguments);
    };
  });
  return new (result as unknown as Constructable<T>);
};
