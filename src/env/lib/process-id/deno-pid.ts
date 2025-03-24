import { PROCESS_ID_MASK } from 'nexid/common/constants';
import { FeatureSet } from 'nexid/env/registry';

export const getProcessId: FeatureSet['ProcessId'] = async (): Promise<number> => {
  if (!Deno?.pid || typeof Deno.pid !== 'number') return 0;
  return Deno.pid & PROCESS_ID_MASK;
};
