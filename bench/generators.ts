import { createId as cuid2 } from '@paralleldrive/cuid2';
import hyperid from 'hyperid';
import KSUID from 'ksuid';
import { nanoid } from 'nanoid';
import crypto from 'node:crypto';
import { ulid } from 'ulid';
import { v1 as uuidv1, v4 as uuidv4, v7 as uuidv7 } from 'uuid';

import NeXID from '../dist/node.js';

export interface GeneratorEntry {
  name: string;
  fn: (() => unknown) | (() => Promise<unknown>);
  async: boolean;
}

export function createGenerators(): GeneratorEntry[] {
  const nexid = NeXID.init();
  const hid = hyperid();

  return [
    { name: 'NeXID.newId()', fn: () => nexid.newId().toString(), async: false },
    { name: 'NeXID.fastId()', fn: () => nexid.fastId(), async: false },
    { name: 'uuid v1', fn: () => uuidv1(), async: false },
    { name: 'uuid v4', fn: () => uuidv4(), async: false },
    { name: 'uuid v7', fn: () => uuidv7(), async: false },
    { name: 'node randomUUID', fn: () => crypto.randomUUID(), async: false },
    { name: 'ulid', fn: () => ulid(), async: false },
    { name: 'nanoid', fn: () => nanoid(), async: false },
    { name: 'cuid2', fn: () => cuid2(), async: false },
    { name: 'hyperid', fn: () => hid(), async: false },
    {
      name: 'ksuid',
      fn: async () => (await KSUID.random()).string,
      async: true,
    },
  ];
}
