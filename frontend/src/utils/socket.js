// Minimal event-emitter for the WebSocket wrapper
class Emitter {
  constructor() {
    this.listeners = new Map();
  }
  on(type, cb) {
    if (!this.listeners.has(type)) this.listeners.set(type, new Set());
    this.listeners.get(type).add(cb);
    return () => this.off(type, cb);
  }
  off(type, cb) {
    if (!cb) this.listeners.delete(type);
    else this.listeners.get(type)?.delete(cb);
  }
  dispatch(type, ...args) {
    this.listeners.get(type)?.forEach((cb) => cb(...args));
  }
}

const backendUrl = import.meta.env.VITE_BACKEND_URL
  ? import.meta.env.VITE_BACKEND_URL.replace(/\/api$/, "").replace(/^http/, "ws")
  : "ws://localhost:8080";

const getToken = () => localStorage.getItem("resqplate_token") || "";

class ReconnectingWebSocket extends Emitter {
  constructor(url) {
    super();
    this.url = url;
    this.counter = 0;
    this.shouldReconnect = true;
    this.reconnectDelay = 1000;
    this.connect();
  }

  connect() {
    const token = getToken();
    const wsUrl = token ? `${this.url}/ws?token=${encodeURIComponent(token)}` : `${this.url}/ws`;
    this.ws = new WebSocket(wsUrl);

    this.ws.onopen = () => {
      this.reconnectDelay = 1000;
      this.dispatch("connect");
    };

    this.ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg?.type) this.dispatch(msg.type, msg);
        this.dispatch("message", msg);
      } catch {
        this.dispatch("message", event.data);
      }
    };

    this.ws.onerror = (err) => this.dispatch("error", err);

    this.ws.onclose = () => {
      this.dispatch("disconnect");
      if (this.shouldReconnect && getToken()) {
        setTimeout(() => this.connect(), this.reconnectDelay);
        this.reconnectDelay = Math.min(this.reconnectDelay * 2, 15000);
      }
    };
  }

  // socket.io-compatible `emit` that sends a JSON frame
  emit(type, payload = {}) {
    if (typeof type !== "string") return;
    const frame =
      type === "joinPickup" || type === "leavePickup"
        ? { type, claimId: payload }
        : { type, ...payload };
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(frame));
    }
  }

  refresh() {
    // Force-reconnect so a freshly stored token is picked up
    this.shouldReconnect = true;
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.close();
    } else {
      this.connect();
    }
  }

  disconnect() {
    this.shouldReconnect = false;
    this.ws?.close();
  }
}

const socket = new ReconnectingWebSocket(backendUrl);

export default socket;