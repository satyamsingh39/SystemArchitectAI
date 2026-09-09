// src/tests/mutation.test.ts
import { describe, it, expect } from "vitest";
import { ArchitectureGraph, ArchitectureComponent, ArchitectureConnection } from "../models";
import { addComponent, removeComponent, updateComponent, addConnection, removeConnection, updateConnection } from "../operations/mutations";
import { validateArchitectureGraph } from "../validation/graph-validation";

const baseComponentA: ArchitectureComponent = {
  id: "compA",
  type: "service",
  name: "A",
  position: { x: 0, y: 0 },
  properties: {},
} as any;

const baseComponentB: ArchitectureComponent = {
  id: "compB",
  type: "service",
  name: "B",
  position: { x: 10, y: 10 },
  properties: {},
} as any;

const baseConnection: ArchitectureConnection = {
  id: "conn1",
  source: "compA",
  target: "compB",
  type: "sync",
} as any;

const emptyGraph: ArchitectureGraph = {
  id: "g1",
  version: "1.0",
  components: [],
  connections: [],
  constraints: [],
  trafficFlows: [],
  decisions: [],
  metadata: { name: "test" },
} as any;

describe("Mutation functions", () => {
  it("addComponent adds component and keeps graph valid", () => {
    const g = addComponent(emptyGraph, baseComponentA);
    expect(g.components).toHaveLength(1);
    const val = validateArchitectureGraph(g);
    expect(val.valid).toBe(true);
  });

  it("removeComponent also removes dependent connections", () => {
    const g1 = addComponent(emptyGraph, baseComponentA);
    const g2 = addComponent(g1, baseComponentB);
    const g3 = addConnection(g2, baseConnection);
    const g4 = removeComponent(g3, "compA");
    expect(g4.components).toHaveLength(1);
    expect(g4.components[0].id).toBe("compB");
    expect(g4.connections).toHaveLength(0); // connection removed
  });

  it("updateComponent updates fields", () => {
    const g = addComponent(emptyGraph, baseComponentA);
    const g2 = updateComponent(g, "compA", { name: "A-updated" });
    expect(g2.components[0].name).toBe("A-updated");
  });

  it("addConnection validates references", () => {
    const g = addComponent(emptyGraph, baseComponentA);
    const g2 = addComponent(g, baseComponentB);
    const g3 = addConnection(g2, baseConnection);
    expect(g3.connections).toHaveLength(1);
    const val = validateArchitectureGraph(g3);
    expect(val.valid).toBe(true);
  });

  it("removeConnection removes correctly", () => {
    const g = addComponent(emptyGraph, baseComponentA);
    const g2 = addComponent(g, baseComponentB);
    const g3 = addConnection(g2, baseConnection);
    const g4 = removeConnection(g3, "conn1");
    expect(g4.connections).toHaveLength(0);
  });

  it("updateConnection updates fields", () => {
    const g = addComponent(emptyGraph, baseComponentA);
    const g2 = addComponent(g, baseComponentB);
    const g3 = addConnection(g2, baseConnection);
    const g4 = updateConnection(g3, "conn1", { type: "async" });
    expect(g4.connections[0].type).toBe("async");
  });
});
