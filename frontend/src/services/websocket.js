import SockJS from 'sockjs-client';
import { over } from 'stompjs';

class WebSocketService {
  constructor() {
    this.stompClient = null;
    this.isConnected = false;
    this.subscribers = new Map();
  }

  connect(token) {
    const socket = new SockJS('https://supplylens-4n7e.onrender.com/ws');
    this.stompClient = over(socket);
    
    // Disable annoying console logs from stomp
    this.stompClient.debug = null; 

    const headers = {
      Authorization: `Bearer ${token}`
    };

    this.stompClient.connect(headers, () => {
      this.isConnected = true;
      console.log('[WS] Connected to SupplyLens Real-Time Engine');
      
      // Re-subscribe to all existing topics if we were disconnected
      this.subscribers.forEach((callbacks, topic) => {
        this.stompClient.subscribe(topic, (msg) => {
          const data = JSON.parse(msg.body);
          callbacks.forEach(cb => cb(data));
        });
      });
    }, (error) => {
      console.error('[WS] Connection error:', error);
      this.isConnected = false;
      // Auto-reconnect after 5 seconds
      setTimeout(() => this.connect(token), 5000);
    });
  }

  subscribe(topic, callback) {
    if (!this.subscribers.has(topic)) {
      this.subscribers.set(topic, new Set());
    }
    this.subscribers.get(topic).add(callback);

    // If already connected, subscribe immediately
    if (this.isConnected && this.stompClient) {
      this.stompClient.subscribe(topic, (msg) => {
        callback(JSON.parse(msg.body));
      });
    }

    return () => {
      this.subscribers.get(topic)?.delete(callback);
    };
  }

  disconnect() {
    if (this.stompClient) {
      this.stompClient.disconnect();
      this.isConnected = false;
    }
  }
}

const wsService = new WebSocketService();
export default wsService;