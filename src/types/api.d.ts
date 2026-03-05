import { Generator } from 'nexid/types/xid-generator';

/** Platform-specific entry points (sync) */
export type initNeXID = (options?: Generator.Options) => Generator.API;

/** Universal auto-detect entry point (async, kept for convenience) */
export type initNeXIDAsync = (options?: Generator.Options) => Promise<Generator.API>;
