import { grpcUnary, FetchFn } from 'ts-rpc-client';

export const ɵReadOnly = Symbol('ts-rpc-reflect.ReadOnly');
export const ɵMiddleware = Symbol('ts-rpc-reflect.Middleware');
export const ɵMetadata = Symbol('ts-rpc-reflect.Metadata');

export const rpc = (): any => new Error('Not implemented');

export interface MiddlewareFn {
  <T>(
    service: { name: string },
    method: string,
    next: (...args: any[]) => T,
    ...args: any[]
  ): T;
}

export const Middleware = (middleware: MiddlewareFn) => {
  return (service: any, method: string, descriptor: PropertyDescriptor) => {
    descriptor.value[ɵMiddleware] = descriptor.value[ɵMiddleware] || {
      middlewares: [],
      service,
      method
    };
    descriptor.value[ɵMiddleware].middlewares.push(middleware);
    return descriptor;
  };
};

export const Metadata = (metadata: [string, string | number]) => {
  return (service: any, method: string, descriptor: PropertyDescriptor) => {
    descriptor.value[ɵMetadata] = descriptor.value[ɵMetadata] || {
      metadatas: [],
      service,
      method
    };
    descriptor.value[ɵMetadata].metadatas.push(metadata);
    return descriptor;
  };
};

export const Read = () => {
  return (_: any, __: string, descriptor: PropertyDescriptor) => {
    descriptor.value[ɵReadOnly] = true;
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
}

const defaultConfig = {
  fetch: ((typeof global !== 'undefined' ? global : window) as any).fetch,
  host: (typeof location !== 'undefined') ? location.protocol + '//' + location.hostname + ':9211' : ''
};

export const serviceFactory = <T extends Function>(
  declaration: T,
  config: Config = defaultConfig
): T => {
  const result = baseFactory(declaration);
  const descriptors = Object.getOwnPropertyDescriptors(declaration.prototype);
  const partialUnary = grpcUnary.bind(
    null,
    config.fetch,
    config.host,
    declaration.name
  );
  const propsAssignment: { [prop: string]: string } = {};
  const metadata: Map<string, string | number> = new Map();
  Object.keys(descriptors).forEach(prop => {
    const descriptor = descriptors[prop];
    result.prototype[prop] = function() {
      const args = arguments;

      (descriptor.value as any)[ɵMetadata]?.metadatas.forEach((m: [string, string | number]) => {
        metadata.set(m[0], m[1]);
      });

      const execute = () =>
        partialUnary(!!(descriptor.value as any)[ɵReadOnly], prop, metadata, ...args);

      const middlewares = (
        (descriptor.value as any)[ɵMiddleware] || {
          middlewares: []
        }
      ).middlewares.slice() as MiddlewareFn[];

      const invokeMiddlewares = <T>(
        current: number,
        middlewares: MiddlewareFn[]
      ): Promise<T> => {
        if (current < 0) {
          return execute();
        }
        return middlewares[current](
          declaration,
          prop,
          () => invokeMiddlewares(current - 1, middlewares),
          ...args
        );
      };
      return invokeMiddlewares(middlewares.length - 1, middlewares);
    };
  });
  const instance = new ((result as unknown) as Constructable<T>)();
  Object.keys(propsAssignment).forEach(prop => {
    (instance as any)[prop] = propsAssignment[prop];
  });
  return instance;
};
