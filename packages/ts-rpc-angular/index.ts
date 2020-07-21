import { getCacheKey } from './cache';
import { Middleware, MiddlewareFn } from 'ts-rpc-reflect';

export * from './auth';

export function unescapeHtml(text: string): string {
  const unescapedText: { [k: string]: string } = {
    '&a;': '&',
    '&q;': '"',
    '&s;': "'",
    '&l;': '<',
    '&g;': '>'
  };
  return text.replace(/&[^;]+;/g, s => unescapedText[s]);
}

const usedCacheKeys = new Set<string>();

export function transferState(key: string): MiddlewareFn {
  return function(
    service: { name: string },
    method: string,
    next: Function,
    ...args: any[]
  ) {
    const cacheKey = getCacheKey(service.name, method, args);
    if (usedCacheKeys.has(cacheKey)) {
      return next(...args);
    }
    usedCacheKeys.add(cacheKey);
    const stateContainer = document.getElementById(key);
    if (!stateContainer) {
      return next(...args);
    }
    const result = JSON.parse(unescapeHtml(stateContainer.innerText))[cacheKey];
    if (!result) {
      return next(...args);
    }
    return Promise.resolve(JSON.parse(result));
  };
}

export function TransferState(key: string = 'app') {
  return (
    service: any,
    method: string,
    descriptor: PropertyDescriptor
  ): PropertyDescriptor =>
    Middleware(transferState(key))(service, method, descriptor);
}
