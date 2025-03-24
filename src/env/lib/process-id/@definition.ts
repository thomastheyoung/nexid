import { FeatureDefinition } from 'nexid/env/registry';

export const ProcessIdDefinition: FeatureDefinition<'ProcessId'> = {
  async test(impl: unknown): Promise<boolean> {
    if (typeof impl !== 'function') return false;
    try {
      const result = await impl();
      return typeof result === 'number' && result > 0;
    } catch {
      return false;
    }
  },

  /**
   * Generates a random process ID when process information is unavailable.
   * This ensures IDs can still be generated with some level of uniqueness.
   *
   * SECURITY NOTE: This hash function is NOT cryptographically secure
   * and should not be used for any security-critical purposes.
   *
   * @returns A Promise that resolves to a Result containing a generated process ID
   */
  async fallback(): Promise<number> {
    console.warn('Using non-secure fallback (process id)');
    // Generate a random number between 1 and 65535 (0xFFFF)
    return Math.floor(Math.random() * 0xffff) + 1;
  },
};
