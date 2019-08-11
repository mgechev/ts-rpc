import { grpcUnary, FetchFn } from 'ts-rpc-client';

export const ɵReadOnly = Symbol('ts-rpc-reflect.ReadOnly');
export const ɵMiddleware = Symbol('ts-rpc-reflect.Middleware');

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
  const propsAssignment: { [prop: string]: string } = {};
  Object.keys(descriptors).forEach(prop => {
    const descriptor = descriptors[prop];
    result.prototype[prop] = function() {
      const args = arguments;
      const execute = () =>
        partialUnary(!!(descriptor.value as any)[ɵReadOnly], prop, ...args);
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
