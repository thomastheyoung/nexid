import { XID } from './core/xid';
import { XIDGenerator } from './core/xid-generator';
import { NodeAdapter } from './env/adapters/node';
import { Generator } from './types/xid-generator';

async function createXIDGenerator(options?: Generator.Options): Promise<Generator.API> {
  return XIDGenerator(NodeAdapter, options);
}

export { XID };
export const init: () => Promise<Generator.API> = createXIDGenerator;
export default { init: createXIDGenerator };
