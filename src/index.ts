import { XID } from './core/xid';
import { XIDGenerator } from './core/xid-generator';
import { getAdapter } from './env/adapters';
import { Generator } from './types/xid-generator';

async function createXIDGenerator(options?: Generator.Options): Promise<Generator.API> {
  const [runtime, adapter] = await getAdapter();
  return XIDGenerator(adapter, options);
}

export { XID };
export const init: () => Promise<Generator.API> = createXIDGenerator;
export default init;
