// WebSocket Service for SupplyLens
// Handles connection, reconnection, and message routing

class WebSocketService {
  constructor() {
    this.ws = null;
    this.subscribers = new Map();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 10;
    this.reconnectDelay = 1000;
    this.url = null;
    this.isConnected = false;
  }

  connect(url = 'ws://localhost:8080') {
    this.url = url;

    try {
      this.ws = new WebSocket(url);

      this.ws.onopen = () => {
        console.log('[WS] Connected to', url);
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this._notify('connection', { status: 'connected' });
      };

      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          const { type, data } = message;
          this._notify(type, data);
        } catch (err) {
          console.warn('[WS] Failed to parse message:', event.data);
        }
      };

      this.ws.onclose = () => {
        console.log('[WS] Disconnected');
        this.isConnected = false;
        this._notify('connection', { status: 'disconnected' });
        this._reconnect();
      };

      this.ws.onerror = (error) => {
        console.error('[WS] Error:', error);
        this._notify('error', { error });
      };
    } catch (err) {
      console.error('[WS] Connection failed:', err);
      this._reconnect();
    }
  }

  _reconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('[WS] Max reconnect attempts reached');
      return;
    }

    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts);
    this.reconnectAttempts++;

    console.log(`[WS] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);
    setTimeout(() => {
      if (this.url) this.connect(this.url);
    }, delay);
  }

  subscribe(event, callback) {
    if (!this.subscribers.has(event)) {
      this.subscribers.set(event, new Set());
    }
    this.subscribers.get(event).add(callback);

    // Return unsubscribe function
    return () => {
      this.subscribers.get(event)?.delete(callback);
    };
  }

  _notify(event, data) {
    this.subscribers.get(event)?.forEach((cb) => {
      try {
        cb(data);
      } catch (err) {
        console.error(`[WS] Subscriber error for ${event}:`, err);
      }
    });
  }

  send(type, data) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type, data }));
    } else {
      console.warn('[WS] Cannot send — not connected');
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

// Singleton instance
const wsService = new WebSocketService();
export default wsService;
