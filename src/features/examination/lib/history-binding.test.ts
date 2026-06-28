import { describe, expect, it } from "vitest";
import {
  HISTORY_SECTION_PREFIX,
  OBGYN_EXAM_CONTAINERS,
} from "./history-binding";

describe("history-binding constants", () => {
  it("exposes the history section code prefix", () => {
    expect(HISTORY_SECTION_PREFIX).toBe("history_");
  });

  it("can identify history-prefixed section codes", () => {
    expect("history_obstetric".startsWith(HISTORY_SECTION_PREFIX)).toBe(true);
    expect("vitals".startsWith(HISTORY_SECTION_PREFIX)).toBe(false);
  });

  it("nests obgyn history fields under obgyn_history", () => {
    expect(OBGYN_EXAM_CONTAINERS.PATIENT_OBGYN_HISTORY).toBe("obgyn_history");
  });

  it("nests vitals fields under vitals", () => {
    expect(OBGYN_EXAM_CONTAINERS.VISIT_VITALS).toBe("vitals");
  });

  it("only maps the two history/vitals namespaces (others stay root-level)", () => {
    expect(Object.keys(OBGYN_EXAM_CONTAINERS).sort()).toEqual([
      "PATIENT_OBGYN_HISTORY",
      "VISIT_VITALS",
    ]);
  });
});
