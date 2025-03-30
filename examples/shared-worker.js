// shared-worker.js - Simplified implementation
// Import the NeXID library
importScripts('./nexid-web.js');

// Store the initialized generator
let xidGenerator = null;

// Track connected clients and their ports
const clients = new Map(); // Maps clientId to port

// Shared state
const sharedState = {
  clientCount: clients.size,
  totalGeneratedIds: 0,
  lastGeneratedId: null,
  history: [], // Keep track of recent IDs
};

// Broadcast to all clients
function broadcast(message) {
  for (const port of clients.values()) {
    port.postMessage(message);
  }
}

// Add to history
function addToHistory(clientId, id) {
  sharedState.history.unshift({
    clientId,
    id,
    timestamp: new Date().toISOString(),
  });

  // Keep history to last 10 items
  if (sharedState.history.length > 10) {
    sharedState.history.pop();
  }

  // Update shared state
  sharedState.totalGeneratedIds++;
  sharedState.lastGeneratedId = id;

  // Broadcast updated state
  broadcast({
    type: 'shared-state-update',
    state: sharedState,
  });
}

// Initialize generator
async function initGenerator() {
  try {
    if (!xidGenerator) {
      xidGenerator = await NeXID.init();
      console.log('Shared Worker: XID generator initialized');
    }
    return true;
  } catch (error) {
    console.error('Shared Worker: Failed to initialize XID generator', error);
    return false;
  }
}

// Handle new connections
self.onconnect = function (e) {
  const port = e.ports[0];

  // Start the port immediately
  port.start();

  // Set up message handler
  port.onmessage = async function (e) {
    const data = e.data;
    console.log('Shared Worker: Received message', data);

    // Register a new client
    if (data.command === 'register') {
      const clientId = data.clientId;
      clients.set(clientId, port);
      console.log(`Shared Worker: Registered client ${clientId}. Total clients: ${clients.size}`);

      // Initialize the generator if needed
      await initGenerator();

      // Send confirmation and current state
      port.postMessage({
        type: 'shared-state-update',
        clientId: clientId,
        state: sharedState,
      });
    }
    // Generate a single XID
    else if (data.command === 'generate-xid') {
      // Make sure generator is initialized
      if (!xidGenerator) {
        const success = await initGenerator();
        if (!success) {
          port.postMessage({
            type: 'error',
            clientId: data.clientId,
            message: 'Failed to initialize XID generator',
          });
          return;
        }
      }

      // Generate ID
      const id = xidGenerator.fastId();

      // Add to history and update state
      addToHistory(data.clientId, id);

      // Send response
      port.postMessage({
        type: 'xid-result',
        clientId: data.clientId,
        id: id,
      });
    }
    // Generate multiple XIDs
    else if (data.command === 'generate-bulk') {
      // Make sure generator is initialized
      if (!xidGenerator) {
        const success = await initGenerator();
        if (!success) {
          port.postMessage({
            type: 'error',
            clientId: data.clientId,
            message: 'Failed to initialize XID generator',
          });
          return;
        }
      }

      const count = data.count || 10000;
      const start = performance.now();
      const ids = [];

      for (let i = 0; i < count; i++) {
        const id = xidGenerator.fastId();
        ids.push(id);

        // Only update history for first and last
        if (i === 0 || i === count - 1) {
          addToHistory(data.clientId, id);
        } else {
          // Just increment count
          sharedState.totalGeneratedIds++;
        }
      }

      const end = performance.now();
      const time = end - start;
      const rate = Math.round(count / (time / 1000));

      // Send response
      port.postMessage({
        type: 'xid-bulk-result',
        clientId: data.clientId,
        count: count,
        sample: ids.slice(0, 3),
        time: time,
        rate: rate,
      });

      // Update state for all clients
      broadcast({
        type: 'shared-state-update',
        state: sharedState,
      });
    }
    // Unregister a client
    else if (data.command === 'unregister') {
      const clientId = data.clientId;
      clients.delete(clientId);
      console.log(
        `Shared Worker: Unregistered client ${clientId}. Remaining clients: ${clients.size}`
      );

      // Update state
      broadcast({
        type: 'shared-state-update',
        state: { ...sharedState, clientCount: clients.size },
      });
    }
  };

  // Handle disconnection
  port.addEventListener('messageerror', function (e) {
    console.error('Shared Worker: Message error', e);
  });
};

// Initialize the generator at startup
initGenerator();
console.log('Shared Worker: Started');
