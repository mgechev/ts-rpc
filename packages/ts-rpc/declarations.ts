export interface FetchFn {
  (input: RequestInfo, init?: RequestInit): Promise<Response>;
}

export const Fetch = Symbol('fetch');
export const Host = Symbol('host');
