/**
 * @module nexid/env/features/machine-id/deno-hostid
 */

import { FeatureSet } from 'nexid/env/registry';
import { getOSMachineId } from './os-hostid';

export const geMachineId: FeatureSet['MachineId'] = async (): Promise<string> => {
  return (await getOSMachineId()) || Deno.hostname();
};
