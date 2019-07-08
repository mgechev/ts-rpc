export interface FetchFn {
    (input: RequestInfo, init?: RequestInit): Promise<Response>;
}
export declare const Fetch: {
    fetch: boolean;
};
export declare const Host: {
    host: boolean;
};
export interface Service {
}
