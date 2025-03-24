import { FeatureDefinition } from 'nexid/env/registry';

export const HashFunctionDefinition: FeatureDefinition<'HashFunction'> = {
  async test(impl: unknown): Promise<boolean> {
    if (typeof impl !== 'function') return false;
    try {
      const result = await impl('custom-hash-test');
      return result instanceof Uint8Array && result.length === 32;
    } catch {
      return false;
    }
  },

  /**
   * Simple fallback hash function when Web Crypto API is unavailable.
   * Uses FNV-1a (Fowler–Noll–Vo) hash algorithm which is fast and has
   * good distribution properties. While not cryptographically secure,
   * it's sufficient for generating machine IDs.
   *
   * SECURITY NOTE: This hash function is NOT cryptographically secure
   * and should not be used for any security-critical purposes.
   *
   * @param data String to hash.
   * @returns 3-byte hash as Uint8Array.
   */
  async fallback(data: string | Uint8Array): Promise<Uint8Array> {
    console.warn('Using non-secure fallback (hash)');

    // Convert input to string
    const str = typeof data === 'string' ? data : data.toString();

    // FNV prime: 16777619 (0x01000193)
    // FNV offset basis: 2166136261 (0x811c9dc5)
    let h = 0x811c9dc5;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = (h * 0x01000193) >>> 0; // multiply by FNV prime and ensure 32-bit unsigned
    }

    // Create a result buffer filled with variations of the hash
    const byteArray = new Uint8Array(32);
    for (let i = 0; i < 32; i++) {
      byteArray[i] = ((h ^ (i * 0x53)) + i) & 0xff;
    }

    return byteArray;
  },
};
