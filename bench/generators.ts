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
}

export function createGenerators(): GeneratorEntry[] {
  const nexid = NeXID.init();
  const hid = hyperid();

  return [
    { name: 'NeXID.newId()', fn: () => nexid.newId().toString() },
    { name: 'NeXID.fastId()', fn: () => nexid.fastId() },
    { name: 'uuid v1', fn: () => uuidv1() },
    { name: 'uuid v4', fn: () => uuidv4() },
    { name: 'uuid v7', fn: () => uuidv7() },
    { name: 'node randomUUID', fn: () => crypto.randomUUID() },
    { name: 'ulid', fn: () => ulid() },
    { name: 'nanoid', fn: () => nanoid() },
    { name: 'cuid2', fn: () => cuid2() },
    { name: 'hyperid', fn: () => hid() },
    { name: 'ksuid', fn: async () => (await KSUID.random()).string },
  ];
}
