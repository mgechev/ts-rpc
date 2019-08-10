import { FetchFn } from 'ts-rpc-client';
export declare const ReadOnly: unique symbol;
export declare const rpc: () => any;
export declare const Read: () => (_: any, __: string, descriptor: PropertyDescriptor) => PropertyDescriptor;
export declare const serviceFactory: <T extends Function>(declaration: T, fetch: FetchFn, host: string) => T;
