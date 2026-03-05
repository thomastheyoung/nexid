import DedicatedWorkerSection from './dedicated-worker/dedicated-worker.svelte';
import ServiceWorkerSection from './service-worker/service-worker.svelte';
import SharedWorkerSection from './shared-worker/shared-worker.svelte';

export { DedicatedWorkerSection, ServiceWorkerSection, SharedWorkerSection };

export type XID = string;
export type ClientID = string;

export type Source = 'client' | 'worker';
export type Destination = 'client' | 'worker' | 'broadcast';

export type PayloadFor<T extends { type: string }, E extends string> =
  Extract<T, { type: E }> extends { payload: infer P } ? P : undefined;
