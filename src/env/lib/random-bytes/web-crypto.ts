import { FeatureSet } from 'nexid/env/registry';

export const randomBytes: FeatureSet['RandomBytes'] = (size: number) => {
  const bytes = new Uint8Array(size);
  return globalThis.crypto.getRandomValues(bytes);
};
