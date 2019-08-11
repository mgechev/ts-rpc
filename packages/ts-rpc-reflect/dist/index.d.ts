import { FetchFn } from 'ts-rpc-client';
export declare const ɵReadOnly: unique symbol;
export declare const ɵTransferState: unique symbol;
export declare const rpc: () => any;
export declare const Read: () => (_: any, __: string, descriptor: PropertyDescriptor) => PropertyDescriptor;
export declare const TransferState: (prop: string) => (_: any, __: string, descriptor: PropertyDescriptor) => PropertyDescriptor;
export interface Config {
    fetch: FetchFn;
    host: string;
    transferId: string;
}
export declare function unescapeHtml(text: string): string;
export declare const serviceFactory: <T extends Function>(declaration: T, config: Config) => T;
