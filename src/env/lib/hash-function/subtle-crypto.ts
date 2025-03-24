import { FeatureSet } from 'nexid/env/registry';

export const hash: FeatureSet['HashFunction'] = async (data: string | Uint8Array) => {
  if (typeof data === 'string') {
    const encoder = new TextEncoder();
    data = encoder.encode(data);
  }
  const buffer = await globalThis.crypto.subtle.digest('SHA-256', data);
  return new Uint8Array(buffer);
};
