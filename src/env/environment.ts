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
  private cache: Map<Feature, FeatureSet[Feature]> = new Map();

  constructor(private adapter: EnvironmentAdapter) {}

  /**
   * Resolves a specific feature implementation, prioritizing:
   * 1. A provided candidate implementation (if valid)
   * 2. Cached implementation (if valid)
   * 3. Adapter-provided implementation (if valid)
   * 4. Fallback implementation as a last resort
   *
   * @param feature - The capability to resolve
   * @param candidate - Optional custom implementation to use if valid
   * @returns Promise resolving to the best available implementation
   */
  async get<F extends Feature>(feature: F, candidate?: FeatureSet[F]): Promise<FeatureSet[F]> {
    const featureDefinition = REGISTRY[feature];

    try {
      // 1. Try the candidate first
      if (candidate && (await featureDefinition.test(candidate))) {
        this.cache.set(feature, candidate); // Update cache with valid candidate
        return candidate;
      }

      // 2. Check the cache
      if (this.cache.has(feature)) {
        const cached = this.cache.get(feature);
        // Re-validate cached entry in case environment conditions changed
        if (await featureDefinition.test(cached)) {
          return cached as FeatureSet[F];
        } else {
          // Remove invalid entry from cache
          this.cache.delete(feature);
        }
      }

      // 3. Try the adapter's implementation
      const adapterFeature = this.adapter[feature];
      if (await featureDefinition.test(adapterFeature)) {
        this.cache.set(feature, adapterFeature); // Cache the valid adapter feature
        return adapterFeature;
      }
    } catch {}

    // Fallback
    return featureDefinition.fallback;
  }
}
