import { Emitter } from "./emitter";

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
    this.pending = [];
    this.connect();
  }

  flush() {
    const pending = this.pending;
    this.pending = [];
    if (this.ws?.readyState !== WebSocket.OPEN) return;
    pending.forEach((frame) => {
      try {
        this.ws.send(frame);
      } catch {
        /* ignore */
      }
    });
  }

  connect() {
    const token = getToken();
    const wsUrl = `${this.url}/ws`;
    // Auth travels in the subprotocol so the token never hits access logs
    this.ws = token
      ? new WebSocket(wsUrl, [`resqauth-${token}`])
      : new WebSocket(wsUrl);

    this.ws.onopen = () => {
      this.reconnectDelay = 1000;
      this.dispatch("connect");
      this.flush();
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

  // socket.io-compatible `emit` that sends a JSON frame (queued until open)
  emit(type, payload = {}) {
    if (typeof type !== "string") return;
    const frame =
      type === "joinPickup" || type === "leavePickup"
        ? { type, claimId: payload }
        : { type, ...payload };
    const json = JSON.stringify(frame);
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(json);
      return;
    }
    if (this.pending.length < 50) this.pending.push(json);
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