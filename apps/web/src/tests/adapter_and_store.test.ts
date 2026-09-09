// src/tests/adapter_and_store.test.ts
import { describe, expect, it, beforeEach } from 'vitest';
import { graphToFlow, componentToNode, connectionToEdge } from '../adapters/reactFlowAdapter';
import { useArchitectureStore } from '../store/architectureStore';
import { architectureEngine } from '../integrations/architecture-engine';
import type { ArchitectureComponent, ArchitectureConnection, ArchitectureGraph, SystemRequirements } from '@systemarchitect/architecture-schema';

function createTestGraph(): ArchitectureGraph {
  return {
    id: 'test-graph',
    version: '1',
    components: [],
    connections: [],
    constraints: [],
    trafficFlows: [],
    decisions: [],
    metadata: {
      name: 'Test Graph',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  };
}

describe('React Flow Adapter & Zustand Store Integration', () => {
  beforeEach(() => {
    // Reset the engine with a clean graph before each test
    const cleanGraph = createTestGraph();
    (architectureEngine as unknown as { graph: ArchitectureGraph }).graph = cleanGraph;
    useArchitectureStore.setState({
      graph: cleanGraph,
      selectedComponentId: undefined,
      selectedConnectionId: undefined,
      error: undefined,
    });
  });

  describe('graphToFlow Adapter', () => {
    it('converts components to React Flow nodes with direct position mapping', () => {
      const component: ArchitectureComponent = {
        id: 'comp-1',
        name: 'Service A',
        type: 'service',
        position: { x: 100, y: 200 },
        properties: {},
      };
      const node = componentToNode(component);
      expect(node.id).toBe('comp-1');
      expect(node.position).toEqual({ x: 100, y: 200 });
      expect(node.data).toEqual({ label: 'Service A', type: 'service' });
    });

    it('converts connections to React Flow edges', () => {
      const connection: ArchitectureConnection = {
        id: 'conn-1',
        source: 'comp-1',
        target: 'comp-2',
        type: 'sync',
      };
      const edge = connectionToEdge(connection);
      expect(edge.id).toBe('conn-1');
      expect(edge.source).toBe('comp-1');
      expect(edge.target).toBe('comp-2');
      expect(edge.data).toEqual({ label: 'sync' });
    });

    it('maps an entire graph to nodes and edges', () => {
      const graph: ArchitectureGraph = {
        ...createTestGraph(),
        components: [
          { id: 'c1', name: 'C1', type: 'service', position: { x: 0, y: 0 }, properties: {} },
          { id: 'c2', name: 'C2', type: 'database', position: { x: 300, y: 0 }, properties: {} },
        ],
        connections: [
          { id: 'conn-12', source: 'c1', target: 'c2', type: 'sync' },
        ],
      };
      const { nodes, edges } = graphToFlow(graph);
      expect(nodes).toHaveLength(2);
      expect(edges).toHaveLength(1);
      expect(nodes[0].id).toBe('c1');
      expect(edges[0].type).toBeUndefined(); // Connection type 'sync' is in data, not React Flow edge type
    });
  });

  describe('useArchitectureStore Operations', () => {
    it('adds a component and updates graph state', () => {
      const store = useArchitectureStore.getState();
      const comp: ArchitectureComponent = {
        id: 'comp-new',
        name: 'New Comp',
        type: 'service',
        position: { x: 100, y: 100 },
        properties: {},
      };
      store.addComponent(comp);

      const state = useArchitectureStore.getState();
      expect(state.graph.components).toHaveLength(1);
      expect(state.graph.components[0].id).toBe('comp-new');
      expect(state.error).toBeUndefined();
    });

    it('edits a component via updateComponent', () => {
      const store = useArchitectureStore.getState();
      const comp: ArchitectureComponent = {
        id: 'c1',
        name: 'Initial Name',
        type: 'service',
        position: { x: 100, y: 100 },
        properties: {},
      };
      store.addComponent(comp);

      useArchitectureStore.getState().updateComponent('c1', {
        name: 'Updated Name',
        technology: 'Node.js',
      });

      const updatedComp = useArchitectureStore.getState().graph.components.find((c) => c.id === 'c1');
      expect(updatedComp?.name).toBe('Updated Name');
      expect(updatedComp?.technology).toBe('Node.js');
    });

    it('deletes a component and cascades dependent connections', () => {
      const store = useArchitectureStore.getState();
      const c1: ArchitectureComponent = { id: 'c1', name: 'C1', type: 'service', position: { x: 0, y: 0 }, properties: {} };
      const c2: ArchitectureComponent = { id: 'c2', name: 'C2', type: 'service', position: { x: 100, y: 0 }, properties: {} };
      const conn: ArchitectureConnection = { id: 'conn-1', source: 'c1', target: 'c2', type: 'sync' };

      store.addComponent(c1);
      store.addComponent(c2);
      store.addConnection(conn);

      expect(useArchitectureStore.getState().graph.connections).toHaveLength(1);

      // Remove c1 -> conn-1 must be cascade-deleted by domain engine
      useArchitectureStore.getState().removeComponent('c1');

      const state = useArchitectureStore.getState();
      expect(state.graph.components).toHaveLength(1);
      expect(state.graph.connections).toHaveLength(0);
    });

    it('creates valid connections and rejects invalid connections', () => {
      const store = useArchitectureStore.getState();
      const c1: ArchitectureComponent = { id: 'c1', name: 'C1', type: 'service', position: { x: 0, y: 0 }, properties: {} };
      const c2: ArchitectureComponent = { id: 'c2', name: 'C2', type: 'service', position: { x: 100, y: 0 }, properties: {} };

      store.addComponent(c1);
      store.addComponent(c2);

      // Valid connection
      store.addConnection({ id: 'conn-ok', source: 'c1', target: 'c2', type: 'sync' });
      expect(useArchitectureStore.getState().graph.connections).toHaveLength(1);
      expect(useArchitectureStore.getState().error).toBeUndefined();

      // Invalid connection (non-existent target)
      store.addConnection({ id: 'conn-invalid', source: 'c1', target: 'non-existent', type: 'sync' });
      const stateAfterFail = useArchitectureStore.getState();
      expect(stateAfterFail.graph.connections).toHaveLength(1); // Previous graph preserved
      expect(stateAfterFail.error).toBeDefined();

      // clearError
      stateAfterFail.clearError();
      expect(useArchitectureStore.getState().error).toBeUndefined();
    });

    it('commits position update exactly once upon drag stop without intermediate store pollution', () => {
      const store = useArchitectureStore.getState();
      const c1: ArchitectureComponent = { id: 'c1', name: 'C1', type: 'service', position: { x: 100, y: 100 }, properties: {} };
      store.addComponent(c1);

      const initialVersion = useArchitectureStore.getState().graph.version;

      // Single drag stop commit
      store.updateComponent('c1', { position: { x: 450, y: 300 } });

      const finalState = useArchitectureStore.getState();
      const updatedComp = finalState.graph.components.find((c) => c.id === 'c1');
      expect(updatedComp?.position).toEqual({ x: 450, y: 300 });
      expect(Number(finalState.graph.version)).toBe(Number(initialVersion) + 1);
    });

    it('handles store requirement actions cleanly', () => {
      const store = useArchitectureStore.getState();

      const newReqs: SystemRequirements = {
        functional: [{ id: 'fr-store', description: 'Log in', priority: 'must' }],
        scale: { requestsPerSecond: 1000 },
        performance: { p95LatencyMs: 150 },
        availability: 99.99,
        consistency: 'eventual',
        constraints: ['Must run on Linux'],
      };

      store.updateRequirements(newReqs);

      const stateAfterUpdate = useArchitectureStore.getState();
      expect(stateAfterUpdate.graph.requirements).toEqual(newReqs);
      expect(stateAfterUpdate.error).toBeUndefined();

      // Add functional requirement via store
      store.addFunctionalRequirement({ id: 'fr-2', description: 'Log out', priority: 'should' });
      expect(useArchitectureStore.getState().graph.requirements?.functional).toHaveLength(2);

      // Remove functional requirement via store
      store.removeFunctionalRequirement('fr-store');
      expect(useArchitectureStore.getState().graph.requirements?.functional).toHaveLength(1);

      // Constraints via store
      store.addConstraint('Zero downtime deployments');
      expect(useArchitectureStore.getState().graph.requirements?.constraints).toContain('Zero downtime deployments');

      store.removeConstraint(0); // Remove "Must run on Linux"
      expect(useArchitectureStore.getState().graph.requirements?.constraints).toEqual(['Zero downtime deployments']);
    });
  });
});
