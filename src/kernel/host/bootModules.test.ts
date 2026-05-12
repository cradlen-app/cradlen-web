import { afterEach, describe, expect, it, vi } from "vitest";

import { __resetRegistriesForTests, bootModules } from "./bootModules";

afterEach(() => {
  vi.unstubAllGlobals();
  __resetRegistriesForTests();
});

describe("bootModules", () => {
  it("is idempotent on the server runtime", () => {
    vi.stubGlobal("window", undefined);
    const first = bootModules();
    const second = bootModules();
    expect(first).toBe(second);
    expect(first.isFrozen).toBe(true);
  });

  it("is idempotent on the client runtime", () => {
    vi.stubGlobal("window", {} as Window);
    const first = bootModules();
    const second = bootModules();
    expect(first).toBe(second);
    expect(first.isFrozen).toBe(true);
  });

  it("uses separate server and client registries", () => {
    vi.stubGlobal("window", undefined);
    const server = bootModules();
    vi.stubGlobal("window", {} as Window);
    const client = bootModules();
    expect(server).not.toBe(client);
    expect(server.isFrozen).toBe(true);
    expect(client.isFrozen).toBe(true);
  });
});
