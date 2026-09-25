// src/tests/component_validation.test.ts
import { describe, it, expect } from "vitest";
import { ArchitectureComponentSchema } from "../models";

const validComponent = {
  id: "comp1",
  type: "service",
  name: "Service A",
  position: { x: 0, y: 0 },
  properties: {},
};

describe("ArchitectureComponent schema validation", () => {
  it("passes for a minimal valid component", () => {
    const result = ArchitectureComponentSchema.safeParse(validComponent as unknown);
    expect(result.success).toBe(true);
  });

  it("fails for negative capacity values", () => {
    const invalid = {
      ...validComponent,
      capacity: { requestsPerSecond: -10 },
    } as unknown;
    const result = ArchitectureComponentSchema.safeParse(invalid);
    expect(result.success).toBe(false);
    const errors = result.error!.errors.map((e) => e.message);
    expect(errors.some((msg) => msg.includes("must be"))).toBe(true);
  });

  it("fails when minInstances > maxInstances in scaling", () => {
    const invalid = {
      ...validComponent,
      scaling: {
        strategy: "horizontal",
        minInstances: 5,
        maxInstances: 3,
      },
    } as unknown;
    const result = ArchitectureComponentSchema.safeParse(invalid);
    expect(result.success).toBe(false);
    const errors = result.error!.errors.map((e) => e.message);
    expect(errors.some((msg) => msg.includes("minInstances must be less than or equal to maxInstances"))).toBe(true);
  });
});
