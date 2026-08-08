import { describe, it, expect, vi } from "vitest";
import { Emitter } from "../emitter";

describe("Emitter (socket wrapper event bus)", () => {
  it("dispatches to registered listeners", () => {
    const emitter = new Emitter();
    const cb = vi.fn();
    emitter.on("chat", cb);
    emitter.dispatch("chat", { type: "chat" });
    expect(cb).toHaveBeenCalledWith({ type: "chat" });
  });

  it("off(type, cb) removes only that listener", () => {
    const emitter = new Emitter();
    const a = vi.fn();
    const b = vi.fn();
    emitter.on("chat", a);
    emitter.on("chat", b);
    emitter.off("chat", a);
    emitter.dispatch("chat");
    expect(a).not.toHaveBeenCalled();
    expect(b).toHaveBeenCalledTimes(1);
  });

  it("off(type) without a callback clears ALL listeners (socket.io semantics)", () => {
    const emitter = new Emitter();
    const a = vi.fn();
    const b = vi.fn();
    emitter.on("chat", a);
    emitter.on("chat", b);
    emitter.off("chat");
    emitter.dispatch("chat");
    expect(a).not.toHaveBeenCalled();
    expect(b).not.toHaveBeenCalled();
  });

  it("unsubscribe function returned by on() works", () => {
    const emitter = new Emitter();
    const cb = vi.fn();
    const unsubscribe = emitter.on("connect", cb);
    unsubscribe();
    emitter.dispatch("connect");
    expect(cb).not.toHaveBeenCalled();
  });
});