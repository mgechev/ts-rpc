import { FetchFn } from './declarations';

const getBody = (args: any[]) => {
  const encoder = new TextEncoder();
  const bin = encoder.encode(JSON.stringify(args));
  const res = [];
  const twoOnEight = Math.pow(2, 8) - 1;
  const len = bin.length;
  if (len >= Math.pow(2, 32)) {
    throw new Error('Cannot accept message longer than 2^32 - 1');
  }
  for (let i = 0; i < 4; i += 1) {
    res.unshift(((twoOnEight << (i * 8)) & len) >> (i * 8));
  }
  return new Blob([new Uint8Array([0, ...res, ...bin])]);
};

export function grpcUnary(
  fetch: FetchFn,
  host: string,
  serviceName: string,
  // side-effect
  _: boolean,
  methodName: string,
  ...args: any[]
) {
  const body = getBody(args);
  return fetch(`${host}/${serviceName}/${methodName}`, {
    method: 'POST',
    mode: 'cors',
    headers: {
      'content-type': 'application/grprc'
    },
    body
  }).then(response => response.json());
}
