import { describe, expect, it } from "vitest";

import {
  DuplicateQueryKeyRootError,
  QueryKeyRegistry,
} from "./QueryKeyRegistry";

describe("QueryKeyRegistry", () => {
  it("tracks ownership of root keys", () => {
    const reg = new QueryKeyRegistry();
    reg.register(["staff"], "staff");
    expect(reg.ownerOf("staff")).toBe("staff");
  });

  it("rejects two modules claiming the same root", () => {
    const reg = new QueryKeyRegistry();
    reg.register(["staff"], "staff");
    expect(() => reg.register(["staff"], "patients")).toThrow(
      DuplicateQueryKeyRootError,
    );
  });

  it("allows the same module to re-register its own root (idempotent boot)", () => {
    const reg = new QueryKeyRegistry();
    reg.register(["staff"], "staff");
    expect(() => reg.register(["staff"], "staff")).not.toThrow();
  });
});
