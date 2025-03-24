import { XID } from './core/xid';
import { XIDGenerator } from './core/xid-generator';
import { WebAdapter } from './env/adapters/web';
import { Generator } from './types/xid-generator';

async function createXIDGenerator(options?: Generator.Options): Promise<Generator.API> {
  return XIDGenerator(WebAdapter, options);
}

export { XID };
export const init: () => Promise<Generator.API> = createXIDGenerator;
export default init;
