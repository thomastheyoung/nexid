import { Feature, FeatureCandidate, FeatureSet, REGISTRY } from './registry';

/**
 * Platform-specific adapter providing candidate implementations for all
 * required features. Candidates may return null to signal failure — the
 * Environment validates each and falls back when needed.
 */
export type EnvironmentAdapter = FeatureCandidate;

/**
 * Options for configuring environment behavior.
 */
export type EnvironmentOptions = {
  /**
   * When true, allows security-critical features to fall back to
   * insecure implementations instead of throwing.
   * @default false
   */
  allowInsecure?: boolean;
};

/**
 * Environment class that manages feature resolution.
 */
export class Environment {
  private cache: Map<Feature, FeatureSet[Feature]> = new Map();
  private readonly allowInsecure: boolean;
  private readonly insecureFallbacks: Set<Feature> = new Set();

  constructor(
    private adapter: EnvironmentAdapter,
    options?: EnvironmentOptions,
  ) {
    this.allowInsecure = options?.allowInsecure ?? false;
  }

  /**
   * Resolves a specific feature implementation, prioritizing:
   * 1. A provided candidate implementation (if valid)
   * 2. Cached implementation (if valid)
   * 3. Adapter-provided implementation (if valid)
   * 4. Fallback implementation as a last resort
   *
   * For security-critical features, throws instead of falling back
   * unless `allowInsecure` was set to true.
   *
   * @param feature - The capability to resolve
   * @param candidate - Optional custom implementation to use if valid
   * @returns The best available implementation
   */
  get<F extends Feature>(feature: F, candidate?: FeatureSet[F]): FeatureSet[F] {
    const def = REGISTRY[feature];

    // 1. Try the candidate first
    if (candidate) {
      try {
        if (def.test(candidate)) {
          this.cache.set(feature, candidate);
          return candidate;
        }
      } catch { /* candidate invalid, continue */ }
    }

    // 2. Check the cache
    const cached = this.cache.get(feature);
    if (cached !== undefined) {
      try {
        if (def.test(cached)) {
          return cached as FeatureSet[F];
        }
      } catch { /* cache entry invalid, continue */ }
      this.cache.delete(feature);
    }

    // 3. Try the adapter's implementation
    try {
      const adapterImpl = this.adapter[feature];
      if (def.test(adapterImpl)) {
        this.cache.set(feature, adapterImpl);
        return adapterImpl as FeatureSet[F];
      }
    } catch { /* adapter failed, fall through */ }

    // 4. Fallback — gate on criticality
    if (def.critical && !this.allowInsecure) {
      throw new Error(
        `nexid: Failed to resolve secure implementation for ${feature}. ` +
          `Set { allowInsecure: true } to allow insecure fallbacks.`,
      );
    }

    if (def.critical) {
      this.insecureFallbacks.add(feature);
    }

    return def.fallback;
  }

  /**
   * Returns true if any feature is using an insecure fallback.
   */
  get degraded(): boolean {
    return this.insecureFallbacks.size > 0;
  }
}
