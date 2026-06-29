import { afterEach, describe, expect, it, vi } from "vitest";

import {
  consoleSink,
  createLogger,
  resetLogSink,
  setLogSink,
  type LogRecord,
} from "./logger";

afterEach(() => {
  resetLogSink();
  vi.restoreAllMocks();
});

describe("createLogger", () => {
  it("forwards level, scope, message, and context to the active sink", () => {
    const records: LogRecord[] = [];
    setLogSink((r) => records.push(r));

    const log = createLogger("billing");
    const boom = new Error("boom");
    log.error("charge failed", { error: boom, invoiceId: "inv_1" });

    expect(records).toEqual([
      {
        level: "error",
        scope: "billing",
        message: "charge failed",
        context: { error: boom, invoiceId: "inv_1" },
      },
    ]);
  });

  it("composes scope through child loggers", () => {
    const records: LogRecord[] = [];
    setLogSink((r) => records.push(r));

    createLogger("visits").child("socket").warn("reconnecting");

    expect(records[0]?.scope).toBe("visits.socket");
    expect(records[0]?.level).toBe("warn");
  });

  it("emits each level", () => {
    const records: LogRecord[] = [];
    setLogSink((r) => records.push(r));

    const log = createLogger("t");
    log.debug("d");
    log.info("i");
    log.warn("w");
    log.error("e");

    expect(records.map((r) => r.level)).toEqual(["debug", "info", "warn", "error"]);
  });
});

describe("setLogSink / resetLogSink", () => {
  it("swaps the transport and restores the console default", () => {
    const spy = vi.fn();
    setLogSink(spy);
    createLogger("x").info("one");
    expect(spy).toHaveBeenCalledTimes(1);

    resetLogSink();
    spy.mockClear();
    createLogger("x").info("two");
    expect(spy).not.toHaveBeenCalled();
  });
});

describe("consoleSink", () => {
  it("maps the level to the matching console method and forwards the error", () => {
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const boom = new Error("nope");

    consoleSink({
      level: "error",
      scope: "dashboard.error",
      message: "render failed",
      context: { error: boom, digest: "abc" },
    });

    expect(errSpy).toHaveBeenCalledWith(
      "[dashboard.error] render failed",
      { digest: "abc" },
      boom,
    );
  });
});
