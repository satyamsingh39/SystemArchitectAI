// src/validation/graph-validation.ts
import { z } from "zod";
import {
  ArchitectureGraphSchema,
  ArchitectureComponentSchema,
  ArchitectureConnectionSchema,
  ArchitectureConstraintSchema,
  TrafficFlowSchema,
  ArchitectureDecisionSchema,
} from "../models";
import { ArchitectureGraph } from "../models";

/**
 * Validate structural integrity of an ArchitectureGraph.
 * Returns an object with a boolean `valid` flag and an array of error messages.
 * This function is pure and deterministic – it does not perform any I/O.
 */
export const validateArchitectureGraph = (graph: ArchitectureGraph): {
  valid: boolean;
  errors: string[];
} => {
  const errors: string[] = [];

  // 1. Validate schema shape using Zod – catch any structural issues.
  const schemaResult = ArchitectureGraphSchema.safeParse(graph);
  if (!schemaResult.success) {
    errors.push(...schemaResult.error.errors.map((e) => `Schema error: ${e.path.join('.')} - ${e.message}`));
    // Continue to collect other errors when possible.
  }

  // Helper to check duplicate IDs in an array of objects with `id`.
  const checkUniqueIds = (items: { id: string }[], entityName: string) => {
    const seen = new Set<string>();
    for (const item of items) {
      if (seen.has(item.id)) {
        errors.push(`Duplicate ${entityName} id: ${item.id}`);
      }
      seen.add(item.id);
    }
  };

  // 2. Unique IDs for each collection.
  checkUniqueIds(graph.components, "component");
  checkUniqueIds(graph.connections, "connection");
  if (graph.constraints) checkUniqueIds(graph.constraints, "constraint");
  if (graph.trafficFlows) checkUniqueIds(graph.trafficFlows, "trafficFlow");
  if (graph.decisions) checkUniqueIds(graph.decisions, "decision");

  // 3. Validate that connection source/target reference existing components.
  const componentIds = new Set(graph.components.map((c) => c.id));
  for (const conn of graph.connections) {
    if (!componentIds.has(conn.source)) {
      errors.push(`Connection ${conn.id} references unknown source component ${conn.source}`);
    }
    if (!componentIds.has(conn.target)) {
      errors.push(`Connection ${conn.id} references unknown target component ${conn.target}`);
    }
  }

  // 4. Optional: validate each sub‑entity with its own Zod schema for field‑level correctness.
  // This ensures values such as enum members, number ranges, etc., are correct.
  graph.components.forEach((c, i) => {
    const result = ArchitectureComponentSchema.safeParse(c);
    if (!result.success) {
      errors.push(`Component[${i}] (${c.id}) schema error: ${result.error.errors.map((e) => e.message).join(', ')}`);
    }
  });

  graph.connections.forEach((c, i) => {
    const result = ArchitectureConnectionSchema.safeParse(c);
    if (!result.success) {
      errors.push(`Connection[${i}] (${c.id}) schema error: ${result.error.errors.map((e) => e.message).join(', ')}`);
    }
  });

  if (graph.constraints) {
    graph.constraints.forEach((c, i) => {
      const result = ArchitectureConstraintSchema.safeParse(c);
      if (!result.success) {
        errors.push(`Constraint[${i}] (${c.id}) schema error: ${result.error.errors.map((e) => e.message).join(', ')}`);
      }
    });
  }

  if (graph.trafficFlows) {
    graph.trafficFlows.forEach((t, i) => {
      const result = TrafficFlowSchema.safeParse(t);
      if (!result.success) {
        errors.push(`TrafficFlow[${i}] (${t.id}) schema error: ${result.error.errors.map((e) => e.message).join(', ')}`);
      }
      if (!componentIds.has(t.source)) {
        errors.push(`TrafficFlow ${t.id} references unknown source component ${t.source}`);
      }
      if (!componentIds.has(t.destination)) {
        errors.push(`TrafficFlow ${t.id} references unknown destination component ${t.destination}`);
      }
    });
  }

  if (graph.decisions) {
    graph.decisions.forEach((d, i) => {
      const result = ArchitectureDecisionSchema.safeParse(d);
      if (!result.success) {
        errors.push(`Decision[${i}] (${d.id}) schema error: ${result.error.errors.map((e) => e.message).join(', ')}`);
      }
    });
  }

  return { valid: errors.length === 0, errors };
};
