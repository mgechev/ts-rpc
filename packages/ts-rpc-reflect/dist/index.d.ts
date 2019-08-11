import { FetchFn } from 'ts-rpc-client';
export declare const ɵReadOnly: unique symbol;
export declare const ɵMiddleware: unique symbol;
export declare const rpc: () => any;
export interface MiddlewareFn {
    <T>(service: {
        name: string;
    }, method: string, next: (...args: any[]) => T, ...args: any[]): T;
}
export declare const Middleware: (middleware: MiddlewareFn) => (service: any, method: string, descriptor: PropertyDescriptor) => PropertyDescriptor;
export declare const Read: () => (_: any, __: string, descriptor: PropertyDescriptor) => PropertyDescriptor;
export interface Config {
    fetch: FetchFn;
    host: string;
}
export declare const serviceFactory: <T extends Function>(declaration: T, config: Config) => T;
