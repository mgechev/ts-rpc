export interface FetchFn {
  (input: RequestInfo, init?: RequestInit): Promise<Response>;
}

export const Fetch = { fetch: true };
export const Host = { host: true };
export interface Service {}
