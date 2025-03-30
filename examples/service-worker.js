// service-worker.js
// Service Worker for XID Generator Test

// Import the NeXID library - using importScripts for the service worker
importScripts('./nexid-web.js');

// Store the initialized generator
let xidGenerator = null;

// Initialize the XID generator
async function initializeGenerator() {
  try {
    xidGenerator = await NeXID.init();
    console.log('Service Worker: XID generator initialized');
  } catch (error) {
    console.error('Service Worker: Failed to initialize XID generator', error);
    return false;
  }
  return true;
}

// Handle install event
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');

  // Skip waiting to activate the service worker immediately
  self.skipWaiting();

  // Initialize generator during installation
  event.waitUntil(initializeGenerator());
});

// Handle activate event
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');

  // Take control of all clients immediately
  event.waitUntil(clients.claim());
});

// Handle messages from the main thread
self.addEventListener('message', async (event) => {
  console.log('Service Worker: Message received', event.data);
  const client = event.source;

  // Make sure the generator is initialized
  if (!xidGenerator) {
    const initialized = await initializeGenerator();
    if (!initialized) {
      client.postMessage({
        type: 'xid-error',
        error: 'Failed to initialize XID generator in service worker',
      });
      return;
    }
  }

  // Handle different commands
  try {
    if (event.data.command === 'generate-xid') {
      const id = xidGenerator.fastId();
      client.postMessage({
        type: 'xid-result',
        id: id,
      });
    } else if (event.data.command === 'generate-bulk') {
      const count = event.data.count || 10000;

      // Measure performance
      const start = performance.now();
      const ids = [];

      for (let i = 0; i < count; i++) {
        ids.push(xidGenerator.fastId());
      }

      const end = performance.now();
      const totalTime = end - start;
      const idsPerSecond = Math.round(count / (totalTime / 1000));

      client.postMessage({
        type: 'xid-bulk-result',
        count: count,
        sample: ids.slice(0, 3),
        time: totalTime,
        idsPerSecond: idsPerSecond,
      });
    }
  } catch (error) {
    console.error('Service Worker: Error processing command', error);
    client.postMessage({
      type: 'xid-error',
      error: error.message,
    });
  }
});

// Handle fetch events if needed
self.addEventListener('fetch', (event) => {
  // We're not intercepting any network requests in this example
  // This is just to keep the service worker alive
});

console.log('Service Worker: Script loaded');
