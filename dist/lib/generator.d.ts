import { XidGenerator, XidOptions } from './types';
/**
 * Create an XID generator with custom options
 */
export declare function createXidGenerator(options?: XidOptions): XidGenerator;
/**
 * Get the default generator, creating it if needed
 */
export declare function getDefaultGenerator(): XidGenerator;
