import { createId as cuid2 } from '@paralleldrive/cuid2';
import hyperid from 'hyperid';
import KSUID from 'ksuid';
import { nanoid } from 'nanoid';
import crypto from 'node:crypto';
import { ulid } from 'ulid';
import { v1 as uuidv1, v4 as uuidv4, v7 as uuidv7 } from 'uuid';

import NeXID from '../dist/node.js';

export type GeneratorEntry =
  | { name: string; async: false; fn: () => unknown }
  | { name: string; async: true; fn: () => Promise<unknown> };

export function createGenerators(): GeneratorEntry[] {
  const nexid = NeXID.init();
  const hid = hyperid();

  return [
    { name: 'NeXID.newId()', async: false, fn: () => nexid.newId().toString() },
    { name: 'NeXID.fastId()', async: false, fn: () => nexid.fastId() },
    { name: 'uuid v1', async: false, fn: () => uuidv1() },
    { name: 'uuid v4', async: false, fn: () => uuidv4() },
    { name: 'uuid v7', async: false, fn: () => uuidv7() },
    { name: 'node randomUUID', async: false, fn: () => crypto.randomUUID() },
    { name: 'ulid', async: false, fn: () => ulid() },
    { name: 'nanoid', async: false, fn: () => nanoid() },
    { name: 'cuid2', async: false, fn: () => cuid2() },
    { name: 'hyperid', async: false, fn: () => hid() },
    { name: 'ksuid', async: true, fn: async () => (await KSUID.random()).string },
  ];
}
