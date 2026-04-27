// WebSocket Service for SupplyLens - POLLING FALLBACK VERSION
// Neutered to allow Polling to take over without console errors

class WebSocketService {
  constructor() {
    this.ws = null;
    this.subscribers = new Map();
    this.isConnected = false;
  }

  connect(url) {
    // Logic disabled for Prototype Stability
    console.log('[WS] WebSocket disabled: Using REST Polling for real-time updates.');
    this.isConnected = false;
  }

  subscribe(event, callback) {
    // We return a dummy unsubscribe function so components don't crash
    if (!this.subscribers.has(event)) {
      this.subscribers.set(event, new Set());
    }
    this.subscribers.get(event).add(callback);
    return () => {
      this.subscribers.get(event)?.delete(callback);
    };
  }

  send(type, data) {
    console.warn('[WS] Send ignored: App is currently in Polling Mode.');
  }

  disconnect() {
    console.log('[WS] Disconnected (Polling Mode)');
    this.isConnected = false;
  }

  // Internal helper kept to avoid reference errors
  _notify(event, data) {
    this.subscribers.get(event)?.forEach((cb) => cb(data));
  }
}

const wsService = new WebSocketService();
export default wsService;