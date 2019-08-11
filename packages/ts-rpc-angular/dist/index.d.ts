import { Provider, ModuleWithProviders } from '@angular/core';
export declare function serializeTransferStateFactory(doc: Document, appId: string): () => void;
export declare function wrapServices(providers: Provider[]): any;
export declare class TSRPCAngularModule {
    static register(...providers: Provider[]): ModuleWithProviders;
}
