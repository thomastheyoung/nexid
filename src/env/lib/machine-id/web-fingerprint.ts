/**
 * Generates an pseudo fingerprint that includes an environment discriminator.
 * Note: This is NOT cryptographically secure.
 */
export async function getFingerprint(): Promise<string> {
  const components: string[] = [];

  // Pseudo random salt
  const salt = ((Math.random() * 0xffff) | 0).toString(16).padStart(2, '0');
  const timestamp = Date.now().toString(36);
  components.push(`salt: ${salt}:${timestamp}`);

  // Environment discriminator
  components.push(`env:${detectContext()}`);

  // Navigator-based components.
  if (exists(navigator)) {
    components.push(`ua:${navigator.userAgent || ''}`);
    components.push(`lang:${navigator.language || ''}`);

    if (navigator.languages && Array.isArray(navigator.languages)) {
      components.push(`langs:${navigator.languages.join(',')}`);
    }

    if ('hardwareConcurrency' in navigator && navigator.hardwareConcurrency) {
      components.push(`cores:${navigator.hardwareConcurrency}`);
    }
    if ('deviceMemory' in navigator && navigator.deviceMemory) {
      components.push(`mem:${navigator.deviceMemory}`);
    }
  }

  // Screen-based components.
  if (exists(screen)) {
    components.push(`colorDepth:${screen.colorDepth}`);
    components.push(`width:${screen.width}`);
    components.push(`height:${screen.height}`);

    if (screen.availWidth) {
      components.push(`availWidth:${screen.availWidth}`);
    }
    if (screen.availHeight) {
      components.push(`availHeight:${screen.availHeight}`);
    }
  }

  // Timezone offset.
  components.push(`tz:${new Date().getTimezoneOffset()}`);
  // return tinyHash(components.filter(Boolean).join('||'));
  return components.filter(Boolean).join('||');
}

function detectContext(): string {
  // Traditional browser (window & document exist)
  if (exists(window) && exists(document)) {
    return 'browser';
  }
  // Web worker environments (no document, but importScripts is available)
  if (exists(self) && typeof importScripts === 'function') {
    // Check for a service worker context
    if (isInstance(self, ServiceWorkerGlobalScope)) {
      return 'service-worker';
    }
    if (isInstance(self, DedicatedWorkerGlobalScope)) {
      return 'dedicated-worker';
    }
    if (isInstance(self, SharedWorkerGlobalScope)) {
      return 'shared-worker';
    }
    return 'web-worker';
  }
  return 'unknown';
}

function exists<T>(object: unknown): object is T {
  return typeof object !== 'undefined';
}

function isInstance<T>(object: unknown, type: T): object is T {
  return typeof type !== 'undefined' && object instanceof (type as any);
}
