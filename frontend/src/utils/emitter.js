// Minimal event-emitter used by the WebSocket wrapper.
// socket.io-compatible: off(type) without a callback removes ALL listeners.
export class Emitter {
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