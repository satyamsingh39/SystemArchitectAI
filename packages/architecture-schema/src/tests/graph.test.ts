// src/tests/graph.test.ts
import { describe, it, expect } from "vitest";
import { ArchitectureGraph, ArchitectureGraphSchema, ArchitectureComponent, ArchitectureConnection } from "../models";
import { validateArchitectureGraph } from "../validation/graph-validation";

const minimalComponent: ArchitectureComponent = {
  id: "comp1",
  type: "service",
  name: "Service A",
  position: { x: 0, y: 0 },
  properties: {},
};

const minimalConnection: ArchitectureConnection = {
  id: "conn1",
  source: "comp1",
  target: "comp1",
  type: "sync",
};

const validGraph: ArchitectureGraph = {
  id: "graph1",
  version: "1.0",
  components: [minimalComponent],
  connections: [minimalConnection],
  constraints: [],
  trafficFlows: [],
  decisions: [],
  metadata: { name: "Test" },
};

describe("ArchitectureGraph validation", () => {
  it("passes for a minimal valid graph", () => {
    const schemaResult = ArchitectureGraphSchema.safeParse(validGraph);
    expect(schemaResult.success).toBe(true);
    const validation = validateArchitectureGraph(validGraph);
    expect(validation.valid).toBe(true);
    expect(validation.errors).toHaveLength(0);
  });
});
