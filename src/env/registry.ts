import { HashFunctionDefinition } from './lib/hash-function/@definition';
import { MachineIdDefinition } from './lib/machine-id/@definition';
import { ProcessIdDefinition } from './lib/process-id/@definition';
import { RandomBytesDefinition } from './lib/random-bytes/@definition';

// ============================================================================
// Types
// ============================================================================
export type FeatureSet = {
  RandomBytes: (size: number) => Uint8Array;
  HashFunction: (data: string | Uint8Array) => Promise<Uint8Array>;
  MachineId: () => Promise<string>;
  ProcessId: () => Promise<number>;
};

export type Feature = keyof FeatureSet;
export type FeatureValidator = (impl: unknown) => Promise<boolean>;
export type FeatureDefinition<F extends Feature> = {
  test: FeatureValidator;
  fallback: FeatureSet[F];
};

export type EnvironmentAdapter = {
  [F in keyof FeatureSet]: FeatureSet[F];
};
type Registry = {
  [F in keyof FeatureSet]: FeatureDefinition<F>;
};

// ============================================================================
// Registry
// ============================================================================
export const REGISTRY: Registry = {
  RandomBytes: RandomBytesDefinition,
  HashFunction: HashFunctionDefinition,
  MachineId: MachineIdDefinition,
  ProcessId: ProcessIdDefinition,
};

export class Environment {
  private cache: Map<Feature, FeatureSet[Feature]> = new Map();

  constructor(private adapter: EnvironmentAdapter) {}

  async get<F extends Feature>(
    feature: F,
    candidate?: FeatureSet[F] | null
  ): Promise<FeatureSet[F]> {
    const featureDefinition = REGISTRY[feature];

    if (candidate && (await featureDefinition.test(candidate))) {
      this.cache.set(feature, candidate);
      return candidate;
    }

    if (this.cache.has(feature)) {
      return this.cache.get(feature) as FeatureSet[F];
    }

    const adapterFeature = this.adapter[feature];
    if (await featureDefinition.test(adapterFeature)) {
      this.cache.set(feature, adapterFeature);
      return adapterFeature;
    }

    // Fallback
    return featureDefinition.fallback;
  }
}
