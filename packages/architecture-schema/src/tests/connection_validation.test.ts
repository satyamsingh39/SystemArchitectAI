// src/tests/connection_validation.test.ts
import { describe, it, expect } from "vitest";
import { ArchitectureConnectionSchema } from "../models";

const validConn = {
  id: "conn1",
  source: "compA",
  target: "compB",
  type: "sync",
};

describe("ArchitectureConnection schema validation", () => {
  it("passes for minimal valid connection", () => {
    const result = ArchitectureConnectionSchema.safeParse(validConn as any);
    expect(result.success).toBe(true);
  });

  it("fails for negative requestRate", () => {
    const invalid = { ...validConn, requestRate: -5 } as any;
    const result = ArchitectureConnectionSchema.safeParse(invalid);
    expect(result.success).toBe(false);

  });
});
