<script lang="ts">
  import Card from '$lib/components/card/card.svelte';
  import {
    DedicatedWorkerSection,
    ServiceWorkerSection,
    SharedWorkerSection
  } from '../workers/index';
  import MainThreadSection from './main-thread.svelte';
  // grid w-full gap-[1rem] pt-5
</script>

<div class="flex flex-col gap-2 pt-5">
  <section>
    <MainThreadSection></MainThreadSection>
  </section>

  <section>
    {#if 'Worker' in globalThis}
      <DedicatedWorkerSection></DedicatedWorkerSection>
    {:else}
      <Card title="Oh no!" description="Shared workers aren't supported on this browser."></Card>
    {/if}
  </section>

  <section>
    {#if 'ServiceWorker' in globalThis}
      <ServiceWorkerSection></ServiceWorkerSection>
    {:else}
      <Card title="Oh no!" description="Service workers aren't supported on this browser."></Card>
    {/if}
  </section>

  <section>
    {#if 'SharedWorker' in globalThis}
      <SharedWorkerSection></SharedWorkerSection>
    {:else}
      <Card title="Oh no!" description="Shared workers aren't supported on this browser."></Card>
    {/if}
  </section>
</div>
