<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    children?: Snippet;
    title: string;
    description: string;
  }
  let { children, title, description }: Props = $props();
</script>

<section
  class="glass mx-auto my-5 max-w-lg min-w-sm flex-col items-start rounded-lg shadow-lg outline outline-black/5"
>
  <!-- min-h-64  -->
  <div class="p-4 text-slate-900">
    <h2 class="text-2xl font-semibold">{title}</h2>
    <div class="mt-1 text-sm">{description}</div>
  </div>
  <div class="p-4 pt-0">
    {@render children?.()}
  </div>
</section>

<style lang="postcss">
  .glass {
    position: relative;
    background: rgba(255, 255, 255, 0.7);
    box-shadow: 0 4px 30px rgba(0, 0, 0, 0.1);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.3);
  }
</style>
