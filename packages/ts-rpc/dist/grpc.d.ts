import { FetchFn } from './declarations';
export declare function grpcUnary(fetch: FetchFn, host: string, serviceName: string, _: boolean, methodName: string, ...args: any[]): Promise<any>;
