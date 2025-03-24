import { FeatureDefinition } from 'nexid/env/registry';

export const MachineIdDefinition: FeatureDefinition<'MachineId'> = {
  async test(impl: unknown): Promise<boolean> {
    if (typeof impl !== 'function') return false;
    try {
      const result = await impl();
      return !!result && typeof result === 'string' && result.length > 0;
    } catch {
      return false;
    }
  },

  /**
   * Generates a random machine ID when no hardware identifiers are available.
   *
   * SECURITY NOTE: This hash function is NOT cryptographically secure
   * and should not be used for any security-critical purposes.
   *
   * @returns A Promise that resolves to a Result containing a generated machine ID
   */
  async fallback(): Promise<string> {
    console.warn('Using non-secure fallback (machine id)');
    const timestamp = Date.now().toString(36);
    const random = () => Math.random().toString(36).substring(2, 10);
    return `${random()}-${timestamp}-${random()}`;
  },
};
