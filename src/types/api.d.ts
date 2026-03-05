import { Generator } from 'nexid/types/xid-generator';

export type initNeXID = (options?: Generator.Options) => Generator.API;

export type ResolvedEnvironment = {
  init: initNeXID;
};
