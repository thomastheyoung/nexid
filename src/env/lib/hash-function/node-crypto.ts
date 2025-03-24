import { FeatureSet } from 'nexid/env/registry';
import crypto from 'node:crypto';

export const hash: FeatureSet['HashFunction'] = async (data: string | Uint8Array) => {
  const buffer = crypto.createHash('sha256').update(data).digest();
  return new Uint8Array(buffer);
};
