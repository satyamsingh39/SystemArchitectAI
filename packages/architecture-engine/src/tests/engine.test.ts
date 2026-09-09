// src/tests/engine.test.ts
import { describe, expect, it } from 'vitest';
import { ArchitectureEngine } from '../engine';
import { ArchitectureGraph, ArchitectureComponent, ArchitectureConnection } from '@systemarchitect/architecture-schema';

// Helper to create a minimal valid graph
function createEmptyGraph(): ArchitectureGraph {
  return {
    id: 'graph-1',
    version: '1',
    components: [],
    connections: [],
    constraints: [],
    trafficFlows: [],
    decisions: [],
    metadata: { name: 'Test Graph' },
  } as ArchitectureGraph;
}

// Minimal required position and properties for a component
const defaultPosition = { x: 0, y: 0 } as const;
const defaultProperties = {} as Record<string, unknown>;

describe('ArchitectureEngine core functionality', () => {
  it('initializes with a valid graph', () => {
    const graph = createEmptyGraph();
    const engine = new ArchitectureEngine(graph);
    expect(engine.getGraph()).toBeDefined();
    expect(engine.getGraph().id).toBe('graph-1');
  });

  it('adds a component and increments version', () => {
    const engine = new ArchitectureEngine(createEmptyGraph());
    const component: ArchitectureComponent = {
      id: 'comp-1',
      name: 'Component 1',
      type: 'service',
      position: defaultPosition,
      properties: defaultProperties,
    } as ArchitectureComponent;
    const result = engine.addComponent(component);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.graph.version).toBe('2');
      expect(engine.getComponent('comp-1')).toEqual(component);
    }
  });

  it('prevents duplicate component addition', () => {
    const engine = new ArchitectureEngine(createEmptyGraph());
    const component: ArchitectureComponent = {
      id: 'c1',
      name: 'C1',
      type: 'service',
      position: defaultPosition,
      properties: defaultProperties,
    } as ArchitectureComponent;
    engine.addComponent(component);
    const duplicateResult = engine.addComponent(component);
    expect(duplicateResult.success).toBe(false);
    if (!duplicateResult.success) {
      expect(duplicateResult.error?.code).toBe('DUPLICATE_COMPONENT');
    }
  });

  it('adds a connection between existing components', () => {
    const engine = new ArchitectureEngine(createEmptyGraph());
    const a: ArchitectureComponent = {
      id: 'a',
      name: 'A',
      type: 'service',
      position: defaultPosition,
      properties: defaultProperties,
    } as ArchitectureComponent;
    const b: ArchitectureComponent = {
      id: 'b',
      name: 'B',
      type: 'service',
      position: defaultPosition,
      properties: defaultProperties,
    } as ArchitectureComponent;
    engine.addComponent(a);
    engine.addComponent(b);
    const connection: ArchitectureConnection = {
      id: 'conn-1',
      source: 'a',
      target: 'b',
      type: 'sync',
    } as ArchitectureConnection;
    const res = engine.addConnection(connection);
    expect(res.success).toBe(true);
    if (res.success) {
      expect(engine.getConnection('conn-1')).toEqual(connection);
      // version should be 4 (initial 1 + add a + add b + add connection)
      expect(res.data.graph.version).toBe('4');
    }
  });

  it('removes a component and its dependent connections', () => {
    const engine = new ArchitectureEngine(createEmptyGraph());
    const a: ArchitectureComponent = {
      id: 'a',
      name: 'A',
      type: 'service',
      position: defaultPosition,
      properties: defaultProperties,
    } as ArchitectureComponent;
    const b: ArchitectureComponent = {
      id: 'b',
      name: 'B',
      type: 'service',
      position: defaultPosition,
      properties: defaultProperties,
    } as ArchitectureComponent;
    engine.addComponent(a);
    engine.addComponent(b);
    const conn: ArchitectureConnection = { id: 'c1', source: 'a', target: 'b', type: 'sync' } as ArchitectureConnection;
    engine.addConnection(conn);
    // Now remove component a
    const res = engine.removeComponent('a');
    expect(res.success).toBe(true);
    if (res.success) {
      expect(engine.getComponent('a')).toBeUndefined();
      // Connection that referenced a should also be gone
      expect(engine.getConnection('c1')).toBeUndefined();
    }
  });
});
