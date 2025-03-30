// dedicated-worker.js
// Dedicated Web Worker for XID Generator Test

// Import the NeXID library
importScripts('./nexid-web.js');

// Store the initialized generator
let xidGenerator = null;

// Initialize the XID generator
async function initializeGenerator() {
  try {
    xidGenerator = await NeXID.init();
    console.log('Dedicated Worker: XID generator initialized');

    // Notify main thread that worker is ready
    self.postMessage({
      type: 'worker-ready',
    });

    return true;
  } catch (error) {
    console.error('Dedicated Worker: Failed to initialize XID generator', error);

    // Notify main thread of initialization failure
    self.postMessage({
      type: 'xid-error',
      error: `Failed to initialize XID generator: ${error.message}`,
      fatal: true,
    });

    return false;
  }
}

// Handle messages from the main thread
self.onmessage = async (event) => {
  console.log('Dedicated Worker: Message received', event.data);

  // Make sure the generator is initialized
  if (!xidGenerator) {
    const initialized = await initializeGenerator();
    if (!initialized) {
      return;
    }
  }

  // Handle different commands
  try {
    if (event.data.command === 'generate-xid') {
      const id = xidGenerator.fastId();
      self.postMessage({
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

      self.postMessage({
        type: 'xid-bulk-result',
        count: count,
        sample: ids.slice(0, 3),
        time: totalTime,
        idsPerSecond: idsPerSecond,
      });
    }
  } catch (error) {
    console.error('Dedicated Worker: Error processing command', error);
    self.postMessage({
      type: 'xid-error',
      error: error.message,
    });
  }
};

// Initialize immediately on worker creation
initializeGenerator();

console.log('Dedicated Worker: Script loaded');
