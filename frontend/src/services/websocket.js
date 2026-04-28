// websocket.js — WebSocket disabled, using polling instead
class WebSocketService {
  connect() {}
  subscribe() { return () => {}; }
  disconnect() {}
  send() {}
  get isConnected() { return false; }
}

const wsService = new WebSocketService();
export default wsService;