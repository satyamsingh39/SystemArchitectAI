# Architecture Domain Model Documentation

## Overview

The **Architecture Domain Model** is the core source‑of‑truth for the SystemArchitect AI application. All UI components, the AI agent, and future evaluation engines operate on this immutable graph representation.

## Core Types (Zod Schemas)

| Type | Description | Exported From |
|------|-------------|---------------|
| `ArchitectureComponent` | Represents a single architectural element such as a service, database, or UI component. Includes optional `capacity` and `scaling` fields. | `src/models/ArchitectureComponent.ts` |
| `ArchitectureConnection` | Directed edge linking a source component to a target component. May include optional `requestRate` and `bandwidth`. | `src/models/ArchitectureConnection.ts` |
| `ArchitectureConstraint` | Declarative rule that can be attached to a component or connection (e.g., "must use TLS"). | `src/models/ArchitectureConstraint.ts` |
| `TrafficFlow` | Describes a flow of requests between two components, used by the future evaluation engine. | `src/models/TrafficFlow.ts` |
| `ArchitectureDecision` | Captures a design decision with rationale, provenance and optional impact metadata. | `src/models/ArchitectureDecision.ts` |
| `ArchitectureMetadata` | Global metadata for a graph (author, version, timestamps, tags). | `src/models/ArchitectureMetadata.ts` |
| `SystemRequirements` / `FunctionalRequirement` | High‑level non‑functional and functional requirements that the graph should satisfy. | `src/models/SystemRequirements.ts`, `src/models/FunctionalRequirement.ts` |
| `ArchitectureChange` | Represents a proposed mutation (add, remove, update) that can be applied immutably. | `src/models/ArchitectureChange.ts` |
| `ArchitectureGraph` | Root object containing arrays of the above entities plus helper maps for fast lookup. | `src/models/ArchitectureGraph.ts` |

All schemas are built with **Zod** and exported from `src/models/index.ts` for easy consumption.

## Pure Mutations (src/operations/mutations.ts)

| Mutation | Purpose | Pure Function Signature |
|----------|---------|--------------------------|
| `addComponent` | Insert a new component, ensuring unique `id`. | `(graph: ArchitectureGraph, component: ArchitectureComponent) => ArchitectureGraph` |
| `removeComponent` | Delete a component and automatically prune any connections that reference it. | `(graph, componentId) => ArchitectureGraph` |
| `updateComponent` | Replace a component with a new version (same `id`). | `(graph, component) => ArchitectureGraph` |
| `addConnection` | Add a directed edge after confirming both component IDs exist. | `(graph, connection) => ArchitectureGraph` |
| `removeConnection` | Delete a connection by its `id`. | `(graph, connectionId) => ArchitectureGraph` |
| `updateConnection` | Update connection metadata while keeping the same `id`. | `(graph, connection) => ArchitectureGraph` |

All functions return a **new** `ArchitectureGraph` instance – they never mutate the input graph.

## Structural Validation (src/validation/graph-validation.ts)

`validateArchitectureGraph(graph)` performs cross‑reference checks that cannot be expressed by Zod alone:

1. **Unique IDs** – component and connection `id`s must be globally unique.
2. **Reference Integrity** – each connection's `source` and `target` must refer to existing component IDs.
3. **Field Value Constraints** – numeric fields (e.g., `capacity.requestsPerSecond`, `scaling.minInstances`) must be ≥ 0 and respect logical relationships (`min ≤ max`).
4. **Consistency** – no dangling connections after component removal, and required metadata fields are present.

The function returns a `ZodResult<ArchitectureGraph>` where `success` is `true` only when all structural rules pass.

## Testing

- **Component schema tests** (`component_validation.test.ts`) verify valid schemas and error messages for negative capacity and invalid scaling relationships.
- **Connection schema tests** (`connection_validation.test.ts`) verify that a negative `requestRate` triggers a validation error.
- **Mutation tests** (`mutations.test.ts`) ensure that each pure mutation returns a new graph and correctly handles dependent connections.

All tests run under **Vitest** and are part of the monorepo `packages/architecture‑schema` workspace.

## Usage

```ts
import { ArchitectureGraph, ArchitectureComponentSchema } from "@systemarchitect/architecture-schema";
import { addComponent, removeComponent } from "@systemarchitect/architecture-schema/src/operations/mutations";
import { validateArchitectureGraph } from "@systemarchitect/architecture-schema/src/validation/graph-validation";

let graph: ArchitectureGraph = { components: [], connections: [], metadata: {/* … */} };

const component = ArchitectureComponentSchema.parse({
  id: "svc-1",
  type: "service",
  name: "User Service",
  position: { x: 0, y: 0 },
  properties: {}
});

graph = addComponent(graph, component);
const validation = validateArchitectureGraph(graph);
if (!validation.success) {
  console.error(validation.error.format());
}
```

## Future Extensions

The current model deliberately excludes:
- Performance, reliability, or cost calculations.
- Persistence layers (PostgreSQL, Neo4j, etc.).
- AI/LLM integration.

These concerns will be added as separate modules that **consume** this immutable graph.

---

*Generated by Antigravity – the foundational domain model for SystemArchitect AI.*
