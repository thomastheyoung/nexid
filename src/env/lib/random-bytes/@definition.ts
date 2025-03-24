import { FeatureDefinition } from 'nexid/env/registry';

export const RandomBytesDefinition: FeatureDefinition<'RandomBytes'> = {
  async test(impl: unknown): Promise<boolean> {
    if (typeof impl !== 'function') return false;
    try {
      const result = impl(5);
      return result instanceof Uint8Array && result.length === 5;
    } catch {
      return false;
    }
  },

  /**
   * Fallback random source that uses Math.random().
   * WARNING: This is NOT cryptographically secure and should only be used
   * when no secure alternatives are available.
   *
   * @param size - Number of random bytes to generate
   * @returns Uint8Array of pseudo-random values
   */
  fallback(size: number): Uint8Array {
    console.warn('Using non-secure fallback (randomBytes)');

    const byteArray = new Uint8Array(size);
    for (let i = 0; i < size; i++) {
      byteArray[i] = Math.floor(Math.random() * 256);
    }
    return byteArray;
  },
};
