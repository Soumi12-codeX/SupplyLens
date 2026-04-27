import SockJS from 'sockjs-client';
import { over } from 'stompjs';

class WebSocketService {
  constructor() {
    this.stompClient = null;
    this.isConnected = false;
    this.subscribers = new Map();
    this.connectionAttempted = false;
  }

  connect(token) {
  if (this.isConnected || (this.stompClient && this.stompClient.ws?.readyState === 0)) {
    return;
  }

  const socket = new SockJS('https://supplylens-4n7e.onrender.com/ws');
  this.stompClient = over(socket);
  this.stompClient.debug = null;

  const headers = { Authorization: `Bearer ${token}` };

  this.stompClient.connect(headers, () => {
    this.isConnected = true;
    console.log('[WS] Connected');

    // Re-subscribe all pending subscribers
    this.subscribers.forEach((callbacks, topic) => {
      this.stompClient.subscribe(topic, (msg) => {
        const data = JSON.parse(msg.body);
        callbacks.forEach(cb => cb(data));
      });
    });
  }, (error) => {
    console.error('[WS] Connection error:', error);
    this.isConnected = false;
    if (this.stompClient) {
      setTimeout(() => this.connect(token), 5000);
    }
  });
}

  subscribe(topic, callback) {
    if (!this.subscribers.has(topic)) {
      this.subscribers.set(topic, new Set());
    }
    this.subscribers.get(topic).add(callback);

    // Only subscribe if the STOMP protocol is fully ready
    if (this.isConnected && this.stompClient?.connected) {
      const sub = this.stompClient.subscribe(topic, (msg) => {
        callback(JSON.parse(msg.body));
      });
      return () => {
        sub.unsubscribe();
        this.subscribers.get(topic)?.delete(callback);
      };
    }

    // Return a cleanup function even if not connected yet
    return () => {
      this.subscribers.get(topic)?.delete(callback);
    };
  }

  disconnect() {
    if (this.stompClient) {
      // Logic Fix: Only call disconnect if the underlying socket is OPEN (1)
      // or if STOMP thinks it is connected.
      if (this.isConnected || (this.stompClient.ws && this.stompClient.ws.readyState === 1)) {
        try {
          this.stompClient.disconnect(() => {
            console.log("[WS] Disconnected Safely");
          });
        } catch (e) {
          console.warn("[WS] Disconnect failed, forcing state reset", e);
        }
      }
      
      // Clean up references to prevent the "reconnect" timeout from firing
      this.stompClient = null;
      this.isConnected = false;
    }
  }
}

const wsService = new WebSocketService();
export default wsService;