import { PROCESS_ID_MASK } from 'nexid/common/constants';
import { FeatureSet } from 'nexid/env/registry';

export const getProcessId: FeatureSet['ProcessId'] = async (): Promise<number> => {
  if (!process?.pid || typeof process.pid !== 'number') return 0;
  return process.pid & PROCESS_ID_MASK;
};
