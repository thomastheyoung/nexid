import { PROCESS_ID_MASK } from 'nexid/common/constants';
import { FeatureSet } from 'nexid/env/registry';

export const getProcessId: FeatureSet['ProcessId'] = async (): Promise<number> => {
  return Math.random() * PROCESS_ID_MASK;
};
