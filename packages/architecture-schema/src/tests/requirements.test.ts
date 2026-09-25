// src/tests/requirements.test.ts
import { describe, it, expect } from "vitest";
import { SystemRequirementsSchema } from "../models";

describe("SystemRequirements schema validation", () => {
  it("validates a minimal functional requirement list", () => {
    const req = {
      functional: [
        { id: "fr1", description: "Must support login", priority: "must" },
        { id: "fr2", description: "Should have dark mode", priority: "should" },
      ],
    } as unknown;
    const result = SystemRequirementsSchema.safeParse(req);
    expect(result.success).toBe(true);
  });

  it("fails on invalid priority value", () => {
    const req = {
      functional: [{ id: "fr1", description: "Invalid", priority: "invalid" }],
    } as unknown;
    const result = SystemRequirementsSchema.safeParse(req);
    expect(result.success).toBe(false);
  });
});
