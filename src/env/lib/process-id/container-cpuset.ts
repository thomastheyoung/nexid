import { FeatureSet } from 'nexid/env/registry';
import { readFile } from '../utils';

export const getProcessId: FeatureSet['ProcessId'] = async (): Promise<number> => {
  // Read the container's cpuset path, which is unique per container
  // This file contains the control group path assigned to the process by the container runtime
  const cpuset: string | null = await readFile('/proc/self/cpuset');

  // Only modify the PID if we have a meaningful cpuset path
  // The root cpuset ('/') isn't container-specific
  return cpuset && cpuset !== '/' ? parseInt(cpuset, 10) : 0;
};
