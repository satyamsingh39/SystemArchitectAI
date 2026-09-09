// tests/evaluation_engine.test.ts
import { describe, expect, it } from 'vitest';
import { EvaluationEngine } from '../src/engine';
import type { ArchitectureGraph } from '@systemarchitect/architecture-schema';

function createBaseGraph(): ArchitectureGraph {
  return {
    id: 'graph-eval-test',
    version: '1',
    components: [],
    connections: [],
    constraints: [],
    trafficFlows: [],
    decisions: [],
    metadata: { name: 'Evaluation Test Graph' },
  };
}

describe('EvaluationEngine Deterministic Static Analysis', () => {
  it('evaluates an empty architecture without crashing', () => {
    const graph = createBaseGraph();
    const result = EvaluationEngine.evaluate(graph);

    expect(result.graphId).toBe('graph-eval-test');
    expect(result.summary.totalFindings).toBe(0);
    expect(result.summary.isCompliant).toBe(true);
  });

  describe('Scalability Evaluator', () => {
    it('detects sufficient workload capacity', () => {
      const graph: ArchitectureGraph = {
        ...createBaseGraph(),
        requirements: {
          functional: [],
          scale: { requestsPerSecond: 1000 },
        },
        components: [
          {
            id: 'c1',
            name: 'API Service',
            type: 'service',
            position: { x: 0, y: 0 },
            properties: {},
            capacity: { requestsPerSecond: 500 },
            scaling: { strategy: 'horizontal', minInstances: 1, maxInstances: 3 }, // 1500 RPS max capacity
          },
        ],
      };

      const result = EvaluationEngine.evaluate(graph);
      const scalabilityDeficits = result.findings.filter((f) => f.id.startsWith('scalability-deficit'));
      expect(scalabilityDeficits).toHaveLength(0);
    });

    it('detects workload capacity deficit and maxInstances limitations', () => {
      const graph: ArchitectureGraph = {
        ...createBaseGraph(),
        requirements: {
          functional: [],
          scale: { requestsPerSecond: 5000 },
        },
        components: [
          {
            id: 'c1',
            name: 'Auth Service',
            type: 'auth',
            position: { x: 0, y: 0 },
            properties: {},
            capacity: { requestsPerSecond: 500 },
            scaling: { strategy: 'horizontal', minInstances: 1, maxInstances: 3 }, // 1500 RPS vs 5000 required
          },
        ],
      };

      const result = EvaluationEngine.evaluate(graph);
      const finding = result.findings.find((f) => f.id === 'scalability-deficit-c1');

      expect(finding).toBeDefined();
      expect(finding?.severity).toBe('critical');
      expect(finding?.observedValue).toBe(1500);
      expect(finding?.thresholdValue).toBe(5000);
    });

    it('reports missing capacity as info finding without crashing', () => {
      const graph: ArchitectureGraph = {
        ...createBaseGraph(),
        requirements: { functional: [], scale: { requestsPerSecond: 1000 } },
        components: [
          { id: 'c1', name: 'Unknown Comp', type: 'service', position: { x: 0, y: 0 }, properties: {} },
        ],
      };

      const result = EvaluationEngine.evaluate(graph);
      const missingFinding = result.findings.find((f) => f.id === 'scalability-missing-c1');

      expect(missingFinding).toBeDefined();
      expect(missingFinding?.severity).toBe('info');
    });
  });

  describe('Bottleneck Evaluator', () => {
    it('aggregates connection request rates and identifies overloaded component', () => {
      const graph: ArchitectureGraph = {
        ...createBaseGraph(),
        components: [
          { id: 'gw', name: 'Gateway', type: 'gateway', position: { x: 0, y: 0 }, properties: {} },
          { id: 'svc', name: 'Worker Service', type: 'service', position: { x: 100, y: 0 }, properties: {}, capacity: { requestsPerSecond: 1000 } },
        ],
        connections: [
          { id: 'conn-1', source: 'gw', target: 'svc', type: 'sync', requestRate: 600 },
          { id: 'conn-2', source: 'gw', target: 'svc', type: 'sync', requestRate: 600 }, // Total incoming = 1200 RPS > 1000 capacity
        ],
      };

      const result = EvaluationEngine.evaluate(graph);
      const overloadFinding = result.findings.find((f) => f.id === 'bottleneck-overloaded-svc');

      expect(overloadFinding).toBeDefined();
      expect(overloadFinding?.severity).toBe('critical');
      expect(overloadFinding?.observedValue).toBe(1.2);
    });

    it('reports info when incoming connections lack requestRate metrics', () => {
      const graph: ArchitectureGraph = {
        ...createBaseGraph(),
        components: [
          { id: 'c1', name: 'C1', type: 'client', position: { x: 0, y: 0 }, properties: {} },
          { id: 'c2', name: 'C2', type: 'service', position: { x: 100, y: 0 }, properties: {} },
        ],
        connections: [
          { id: 'conn-12', source: 'c1', target: 'c2', type: 'sync' },
        ],
      };

      const result = EvaluationEngine.evaluate(graph);
      const infoFinding = result.findings.find((f) => f.id === 'bottleneck-missing-rate-c2');

      expect(infoFinding).toBeDefined();
      expect(infoFinding?.severity).toBe('info');
    });
  });

  describe('Performance Evaluator', () => {
    it('accumulates synchronous path latency and detects SLA violation', () => {
      const graph: ArchitectureGraph = {
        ...createBaseGraph(),
        requirements: {
          functional: [],
          performance: { p95LatencyMs: 100 },
        },
        components: [
          { id: 'client', name: 'Web Client', type: 'client', position: { x: 0, y: 0 }, properties: {} },
          { id: 'gw', name: 'API Gateway', type: 'gateway', position: { x: 100, y: 0 }, properties: {} },
          { id: 'db', name: 'Postgres DB', type: 'database', position: { x: 200, y: 0 }, properties: {} },
        ],
        connections: [
          { id: 'conn-1', source: 'client', target: 'gw', type: 'sync', latencyMs: 30 },
          { id: 'conn-2', source: 'gw', target: 'db', type: 'sync', latencyMs: 90 }, // Total path = 120ms > 100ms SLA
        ],
      };

      const result = EvaluationEngine.evaluate(graph);
      const slaFinding = result.findings.find((f) => f.id === 'performance-sla-violation');

      expect(slaFinding).toBeDefined();
      expect(slaFinding?.severity).toBe('critical');
      expect(slaFinding?.observedValue).toBe(120);
      expect(slaFinding?.thresholdValue).toBe(100);
    });

    it('handles synchronous cycles safely without infinite recursion', () => {
      const graph: ArchitectureGraph = {
        ...createBaseGraph(),
        components: [
          { id: 's1', name: 'Service 1', type: 'service', position: { x: 0, y: 0 }, properties: {} },
          { id: 's2', name: 'Service 2', type: 'service', position: { x: 100, y: 0 }, properties: {} },
        ],
        connections: [
          { id: 'c12', source: 's1', target: 's2', type: 'sync', latencyMs: 10 },
          { id: 'c21', source: 's2', target: 's1', type: 'sync', latencyMs: 10 }, // Cycle s1 <-> s2
        ],
      };

      const result = EvaluationEngine.evaluate(graph);
      const cycleFinding = result.findings.find((f) => f.id === 'performance-sync-cycle');

      expect(cycleFinding).toBeDefined();
      expect(cycleFinding?.severity).toBe('warning');
    });
  });

  describe('Reliability Evaluator', () => {
    it('identifies obvious Single Point of Failure (SPOF) on connected critical service', () => {
      const graph: ArchitectureGraph = {
        ...createBaseGraph(),
        components: [
          {
            id: 'db-main',
            name: 'Primary DB',
            type: 'database',
            position: { x: 0, y: 0 },
            properties: {},
            reliability: { replicas: 1 },
            scaling: { strategy: 'none' },
          },
          { id: 'svc', name: 'App Service', type: 'service', position: { x: 100, y: 0 }, properties: {} },
        ],
        connections: [
          { id: 'conn-svc-db', source: 'svc', target: 'db-main', type: 'sync' },
        ],
      };

      const result = EvaluationEngine.evaluate(graph);
      const spofFinding = result.findings.find((f) => f.id === 'reliability-spof-db-main');

      expect(spofFinding).toBeDefined();
      expect(spofFinding?.severity).toBe('warning');
    });

    it('compares component availability target against system requirements', () => {
      const graph: ArchitectureGraph = {
        ...createBaseGraph(),
        requirements: {
          functional: [],
          availability: 99.99,
        },
        components: [
          {
            id: 'svc',
            name: 'Core Service',
            type: 'service',
            position: { x: 0, y: 0 },
            properties: {},
            reliability: { availabilityTarget: 99.5 }, // 99.5 < 99.99
          },
        ],
      };

      const result = EvaluationEngine.evaluate(graph);
      const availFinding = result.findings.find((f) => f.id === 'reliability-availability-deficit-svc');

      expect(availFinding).toBeDefined();
      expect(availFinding?.severity).toBe('critical');
      expect(availFinding?.observedValue).toBe(99.5);
      expect(availFinding?.thresholdValue).toBe(99.99);
    });
  });

  describe('Strict Determinism', () => {
    it('produces semantically identical results and finding order across 100 evaluations', () => {
      const graph: ArchitectureGraph = {
        ...createBaseGraph(),
        requirements: {
          functional: [],
          scale: { requestsPerSecond: 2000 },
          performance: { p95LatencyMs: 50 },
          availability: 99.9,
        },
        components: [
          { id: 'gw', name: 'Gateway', type: 'gateway', position: { x: 0, y: 0 }, properties: {}, capacity: { requestsPerSecond: 1000 }, reliability: { replicas: 1 } },
          { id: 'db', name: 'Database', type: 'database', position: { x: 100, y: 0 }, properties: {}, reliability: { availabilityTarget: 99.0 } },
        ],
        connections: [
          { id: 'conn-1', source: 'gw', target: 'db', type: 'sync', latencyMs: 60, requestRate: 1500 },
        ],
      };

      const firstRun = EvaluationEngine.evaluate(graph);

      for (let i = 0; i < 100; i++) {
        const nextRun = EvaluationEngine.evaluate(graph);
        expect(nextRun).toEqual(firstRun);
      }
    });
  });
});
