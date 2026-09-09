// src/engine.ts
import {
  ArchitectureGraph,
  ArchitectureComponent,
  ArchitectureConnection,
  ArchitectureChange,
  AddComponentChange,
  RemoveComponentChange,
  UpdateComponentChange,
  AddConnectionChange,
  RemoveConnectionChange,
  UpdateConnectionChange,
  TrafficFlow,
  SystemRequirements,
  FunctionalRequirement,
  SystemRequirementsSchema,
} from '@systemarchitect/architecture-schema';
import { validateArchitectureGraph } from '@systemarchitect/architecture-schema';
import {
  addComponent as schemaAddComponent,
  removeComponent as schemaRemoveComponent,
  updateComponent as schemaUpdateComponent,
  addConnection as schemaAddConnection,
  removeConnection as schemaRemoveConnection,
  updateConnection as schemaUpdateConnection,
} from '@systemarchitect/architecture-schema';
import { EngineError, EngineErrorCode } from './errors/engineError';
import { EngineResult } from './types/result';

export class ArchitectureEngine {
  private graph: ArchitectureGraph;

  constructor(initialGraph: ArchitectureGraph) {
    const validation = validateArchitectureGraph(initialGraph);
    if (!validation.valid) {
      throw new EngineError(EngineErrorCode.ValidationFailure, 'Invalid initial graph', undefined, validation.errors);
    }
    this.graph = structuredClone(initialGraph);
  }

  getGraph(): ArchitectureGraph {
    return this.graph;
  }

  getSnapshot(): ArchitectureGraph {
    return structuredClone(this.graph);
  }

  // --------------------- Mutations ---------------------

  addComponent(component: ArchitectureComponent): EngineResult<{ graph: ArchitectureGraph; change: AddComponentChange }> {
    if (this.graph.components.some((c) => c.id === component.id)) {
      return { success: false, error: new EngineError(EngineErrorCode.DuplicateComponent, `Component with id ${component.id} already exists`, component.id) };
    }
    let newGraph: ArchitectureGraph;
    try {
      newGraph = schemaAddComponent(this.graph, component);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      return { success: false, error: new EngineError(EngineErrorCode.InvalidOperation, msg) };
    }
    const change: AddComponentChange = { type: 'addComponent', component };
    return this.commit(newGraph, change);
  }

  removeComponent(componentId: string): EngineResult<{ graph: ArchitectureGraph; change: RemoveComponentChange }> {
    if (!this.graph.components.some((c) => c.id === componentId)) {
      return { success: false, error: new EngineError(EngineErrorCode.ComponentNotFound, `Component ${componentId} not found`, componentId) };
    }
    let newGraph: ArchitectureGraph;
    try {
      newGraph = schemaRemoveComponent(this.graph, componentId);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      return { success: false, error: new EngineError(EngineErrorCode.InvalidOperation, msg) };
    }
    const change: RemoveComponentChange = { type: 'removeComponent', componentId };
    return this.commit(newGraph, change);
  }

  updateComponent(componentId: string, updates: Partial<ArchitectureComponent>): EngineResult<{ graph: ArchitectureGraph; change: UpdateComponentChange }> {
    if (!this.graph.components.some((c) => c.id === componentId)) {
      return { success: false, error: new EngineError(EngineErrorCode.ComponentNotFound, `Component ${componentId} not found`, componentId) };
    }
    let newGraph: ArchitectureGraph;
    try {
      newGraph = schemaUpdateComponent(this.graph, componentId, updates);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      return { success: false, error: new EngineError(EngineErrorCode.InvalidOperation, msg) };
    }
    const change: UpdateComponentChange = { type: 'updateComponent', componentId, updates };
    return this.commit(newGraph, change);
  }

  addConnection(connection: ArchitectureConnection): EngineResult<{ graph: ArchitectureGraph; change: AddConnectionChange }> {
    if (this.graph.connections.some((c) => c.id === connection.id)) {
      return { success: false, error: new EngineError(EngineErrorCode.DuplicateConnection, `Connection ${connection.id} already exists`, connection.id) };
    }
    const componentIds = new Set(this.graph.components.map((c) => c.id));
    if (!componentIds.has(connection.source)) {
      return { success: false, error: new EngineError(EngineErrorCode.InvalidReference, `Source component ${connection.source} does not exist`, connection.source) };
    }
    if (!componentIds.has(connection.target)) {
      return { success: false, error: new EngineError(EngineErrorCode.InvalidReference, `Target component ${connection.target} does not exist`, connection.target) };
    }
    let newGraph: ArchitectureGraph;
    try {
      newGraph = schemaAddConnection(this.graph, connection);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      return { success: false, error: new EngineError(EngineErrorCode.InvalidOperation, msg) };
    }
    const change: AddConnectionChange = { type: 'addConnection', connection };
    return this.commit(newGraph, change);
  }

  removeConnection(connectionId: string): EngineResult<{ graph: ArchitectureGraph; change: RemoveConnectionChange }> {
    if (!this.graph.connections.some((c) => c.id === connectionId)) {
      return { success: false, error: new EngineError(EngineErrorCode.ConnectionNotFound, `Connection ${connectionId} not found`, connectionId) };
    }
    let newGraph: ArchitectureGraph;
    try {
      newGraph = schemaRemoveConnection(this.graph, connectionId);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      return { success: false, error: new EngineError(EngineErrorCode.InvalidOperation, msg) };
    }
    const change: RemoveConnectionChange = { type: 'removeConnection', connectionId };
    return this.commit(newGraph, change);
  }

  updateConnection(connectionId: string, updates: Partial<ArchitectureConnection>): EngineResult<{ graph: ArchitectureGraph; change: UpdateConnectionChange }> {
    if (!this.graph.connections.some((c) => c.id === connectionId)) {
      return { success: false, error: new EngineError(EngineErrorCode.ConnectionNotFound, `Connection ${connectionId} not found`, connectionId) };
    }
    let newGraph: ArchitectureGraph;
    try {
      newGraph = schemaUpdateConnection(this.graph, connectionId, updates);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      return { success: false, error: new EngineError(EngineErrorCode.InvalidOperation, msg) };
    }
    const change: UpdateConnectionChange = { type: 'updateConnection', connectionId, updates };
    return this.commit(newGraph, change);
  }

  // --------------------- Requirements Mutations ---------------------

  updateRequirements(requirements: SystemRequirements): EngineResult<{ graph: ArchitectureGraph }> {
    const parseResult = SystemRequirementsSchema.safeParse(requirements);
    if (!parseResult.success) {
      const errors = parseResult.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`);
      return {
        success: false,
        error: new EngineError(EngineErrorCode.ValidationFailure, 'Invalid system requirements', undefined, errors),
      };
    }

    const newGraph = structuredClone(this.graph);
    newGraph.requirements = parseResult.data;
    return this.commitDirect(newGraph);
  }

  addFunctionalRequirement(requirement: FunctionalRequirement): EngineResult<{ graph: ArchitectureGraph }> {
    const currentRequirements: SystemRequirements = this.graph.requirements ?? {
      functional: [],
      scale: {},
      performance: {},
      constraints: [],
    };

    if (currentRequirements.functional.some((req) => req.id === requirement.id)) {
      return {
        success: false,
        error: new EngineError(
          EngineErrorCode.InvalidOperation,
          `Functional requirement with id ${requirement.id} already exists`,
          requirement.id
        ),
      };
    }

    const updatedRequirements: SystemRequirements = {
      ...currentRequirements,
      functional: [...currentRequirements.functional, requirement],
    };

    return this.updateRequirements(updatedRequirements);
  }

  removeFunctionalRequirement(id: string): EngineResult<{ graph: ArchitectureGraph }> {
    const currentRequirements = this.graph.requirements;
    if (!currentRequirements || !currentRequirements.functional.some((req) => req.id === id)) {
      return {
        success: false,
        error: new EngineError(
          EngineErrorCode.InvalidOperation,
          `Functional requirement with id ${id} not found`,
          id
        ),
      };
    }

    const updatedRequirements: SystemRequirements = {
      ...currentRequirements,
      functional: currentRequirements.functional.filter((req) => req.id !== id),
    };

    return this.updateRequirements(updatedRequirements);
  }

  addConstraint(constraint: string): EngineResult<{ graph: ArchitectureGraph }> {
    const trimmed = constraint.trim();
    if (!trimmed) {
      return {
        success: false,
        error: new EngineError(EngineErrorCode.InvalidOperation, 'Constraint string cannot be empty'),
      };
    }

    const currentRequirements: SystemRequirements = this.graph.requirements ?? {
      functional: [],
      scale: {},
      performance: {},
      constraints: [],
    };

    const updatedRequirements: SystemRequirements = {
      ...currentRequirements,
      constraints: [...(currentRequirements.constraints ?? []), trimmed],
    };

    return this.updateRequirements(updatedRequirements);
  }

  removeConstraint(index: number): EngineResult<{ graph: ArchitectureGraph }> {
    const currentRequirements = this.graph.requirements;
    const currentConstraints = currentRequirements?.constraints ?? [];

    if (index < 0 || index >= currentConstraints.length) {
      return {
        success: false,
        error: new EngineError(EngineErrorCode.InvalidOperation, `Invalid constraint index ${index}`),
      };
    }

    const updatedConstraints = currentConstraints.filter((_, i) => i !== index);
    const updatedRequirements: SystemRequirements = {
      ...currentRequirements!,
      constraints: updatedConstraints,
    };

    return this.updateRequirements(updatedRequirements);
  }

  // --------------------- Queries ---------------------

  getComponent(id: string): ArchitectureComponent | undefined {
    return this.graph.components.find((c) => c.id === id);
  }

  getComponents(): ArchitectureComponent[] {
    return this.graph.components;
  }

  getConnection(id: string): ArchitectureConnection | undefined {
    return this.graph.connections.find((c) => c.id === id);
  }

  getConnections(): ArchitectureConnection[] {
    return this.graph.connections;
  }

  getIncomingConnections(componentId: string): ArchitectureConnection[] {
    return this.graph.connections.filter((c) => c.target === componentId);
  }

  getOutgoingConnections(componentId: string): ArchitectureConnection[] {
    return this.graph.connections.filter((c) => c.source === componentId);
  }

  getNeighbors(componentId: string): string[] {
    const incoming = this.getIncomingConnections(componentId).map((c) => c.source);
    const outgoing = this.getOutgoingConnections(componentId).map((c) => c.target);
    const set = new Set<string>([...incoming, ...outgoing]);
    set.delete(componentId);
    return Array.from(set);
  }

  getTrafficFlow(id: string): TrafficFlow | undefined {
    return this.graph.trafficFlows?.find((t) => t.id === id);
  }

  getTrafficFlows(): TrafficFlow[] {
    return this.graph.trafficFlows ?? [];
  }

  getRequirements(): SystemRequirements | undefined {
    return this.graph.requirements as SystemRequirements | undefined;
  }

  // --------------------- Traversal ---------------------

  isReachable(sourceId: string, targetId: string): boolean {
    const visited = new Set<string>();
    const queue: string[] = [sourceId];
    while (queue.length) {
      const cur = queue.shift()!;
      if (cur === targetId) return true;
      if (visited.has(cur)) continue;
      visited.add(cur);
      for (const nb of this.getNeighbors(cur)) {
        if (!visited.has(nb)) queue.push(nb);
      }
    }
    return false;
  }

  findPath(sourceId: string, targetId: string): string[] {
    const queue: string[] = [sourceId];
    const visited = new Set<string>();
    const predecessor: Record<string, string | null> = { [sourceId]: null };
    while (queue.length) {
      const cur = queue.shift()!;
      if (cur === targetId) break;
      if (visited.has(cur)) continue;
      visited.add(cur);
      for (const nb of this.getNeighbors(cur)) {
        if (!(nb in predecessor)) {
          predecessor[nb] = cur;
          queue.push(nb);
        }
      }
    }
    if (!(targetId in predecessor)) return [];
    const path: string[] = [];
    let cur: string | null = targetId;
    while (cur) {
      path.unshift(cur);
      cur = predecessor[cur];
    }
    return path;
  }

  // --------------------- Impact Analysis ---------------------

  getAffectedComponents(change: ArchitectureChange): string[] {
    switch (change.type) {
      case 'addComponent':
        return [change.component.id];
      case 'removeComponent':
        const removedId = change.componentId;
        const connected = this.graph.connections
          .filter((c) => c.source === removedId || c.target === removedId)
          .map((c) => (c.source === removedId ? c.target : c.source));
        return [removedId, ...connected];
      case 'updateComponent':
        return [change.componentId];
      case 'addConnection':
      case 'removeConnection':
      case 'updateConnection':
        if ('connection' in change) {
          const { connection } = change;
          return [connection.source, connection.target];
        } else {
          const { connectionId } = change;
          const conn = this.graph.connections.find((c) => c.id === connectionId);
          return conn ? [conn.source, conn.target] : [];
        }
      default:
        return [];
    }
  }

  // --------------------- Internal Helpers ---------------------

  private commitDirect(newGraph: ArchitectureGraph): EngineResult<{ graph: ArchitectureGraph }> {
    const validation = validateArchitectureGraph(newGraph);
    if (!validation.valid) {
      return {
        success: false,
        error: new EngineError(EngineErrorCode.ValidationFailure, 'Graph validation failed', undefined, validation.errors),
      };
    }
    const currentVersion = parseInt(this.graph.version, 10) || 0;
    newGraph.version = (currentVersion + 1).toString();
    this.graph = newGraph;
    return { success: true, data: { graph: this.graph } };
  }

  private commit<T>(newGraph: ArchitectureGraph, change: ArchitectureChange): EngineResult<T> {
    const validation = validateArchitectureGraph(newGraph);
    if (!validation.valid) {
      return { success: false, error: new EngineError(EngineErrorCode.ValidationFailure, 'Graph validation failed', undefined, validation.errors) };
    }
    const currentVersion = parseInt(this.graph.version, 10) || 0;
    newGraph.version = (currentVersion + 1).toString();
    this.graph = newGraph;
    return { success: true, data: { graph: this.graph, change } as unknown as T };
  }
}
