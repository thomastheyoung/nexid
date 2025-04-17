import { Feature, FeatureSet, REGISTRY } from './registry';

/**
 * Platform-specific adapter providing implementations for all required features.
 */
export type EnvironmentAdapter = {
  [F in keyof FeatureSet]: FeatureSet[F];
};

/**
 * Environment class that manages feature resolution.
 */
export class Environment {
  constructor(private adapter: EnvironmentAdapter) {}

  /**
   * Resolves a specific feature implementation, prioritizing:
   * 1. A provided candidate implementation (if valid)
   * 2. Adapter-provided implementation
   * 3. Fallback implementation as a last resort
   *
   * @param feature - The capability to resolve
   * @param candidate - Optional custom implementation to use if valid
   * @returns Promise resolving to the best available implementation
   */
  async get<F extends Feature>(feature: F, candidate?: FeatureSet[F]): Promise<FeatureSet[F]> {
    const featureDefinition = REGISTRY[feature];
    try {
      if (candidate && (await featureDefinition.test(candidate))) {
        return candidate;
      }

      const adapterFeature = this.adapter[feature];
      if (await featureDefinition.test(adapterFeature)) {
        return adapterFeature;
      }
    } catch {}

    // Fallback
    return featureDefinition.fallback;
  }
}
