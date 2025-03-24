import { FeatureSet } from 'nexid/env/registry';
import crypto from 'node:crypto';

export const randomBytes: FeatureSet['RandomBytes'] = (size: number) => {
  const buffer = crypto.randomBytes(size);
  return new Uint8Array(buffer);
};
