import { getCacheKey } from './cache';

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

export function transferState(key: string) {
  return function(
    service: Function,
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
