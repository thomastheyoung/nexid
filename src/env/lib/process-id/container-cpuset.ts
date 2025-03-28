/**
 * @module nexid/env/lib/process-id/container-cpuset
 * 
 * Process ID generation for containerized environments.
 * 
 * ARCHITECTURE:
 * This module provides an implementation to retrieve a unique process identifier
 * in containerized environments by reading the container's assigned cgroup path.
 * Container environments (like Docker, Kubernetes pods) share the host's process IDs,
 * which can lead to ID collisions when multiple containers run on the same host.
 * 
 * Reading the `/proc/self/cpuset` file gives access to the control group path
 * assigned by the container runtime, which is guaranteed to be unique per container
 * instance, providing better isolation between containerized applications.
 * 
 * SECURITY:
 * This approach does not introduce any security vulnerabilities as it only
 * accesses information already available to the process within its container.
 * The cpuset information is not sensitive and contains no credentials.
 */

import { FeatureSet } from 'nexid/env/registry';
import { readFile } from '../utils';

/**
 * Retrieves a container-specific identifier by reading the cgroup cpuset path.
 * 
 * In containerized environments, this provides better isolation than process IDs,
 * which might be shared or reset across container instances.
 * 
 * @returns Promise resolving to a numeric ID derived from the cpuset path or 0 if unavailable
 */
export const getProcessId: FeatureSet['ProcessId'] = async (): Promise<number> => {
  // Read the container's cpuset path, which is unique per container
  // This file contains the control group path assigned to the process by the container runtime
  const cpuset: string | null = await readFile('/proc/self/cpuset');

  // Only modify the PID if we have a meaningful cpuset path
  // The root cpuset ('/') isn't container-specific
  return cpuset && cpuset !== '/' ? parseInt(cpuset, 10) : 0;
};
