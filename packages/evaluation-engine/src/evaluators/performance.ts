// src/evaluators/performance.ts
import type { ArchitectureGraph, ArchitectureConnection } from '@systemarchitect/architecture-schema';
import type { EvaluationFinding } from '../types/result';

export function evaluatePerformance(graph: ArchitectureGraph): EvaluationFinding[] {
  const findings: EvaluationFinding[] = [];

  const targetLatencySLA =
    graph.requirements?.performance?.p95LatencyMs ??
    graph.requirements?.performance?.p99LatencyMs ??
    graph.requirements?.performance?.p50LatencyMs;

  const syncConnections = graph.connections.filter((c) => c.type === 'sync');
  if (syncConnections.length === 0) {
    return findings;
  }

  // Build adjacency list for synchronous directed graph
  const adjacency = new Map<string, Array<{ target: string; connection: ArchitectureConnection }>>();
  const inDegree = new Map<string, number>();

  for (const component of graph.components) {
    adjacency.set(component.id, []);
    inDegree.set(component.id, 0);
  }

  for (const conn of syncConnections) {
    const list = adjacency.get(conn.source);
    if (list) {
      list.push({ target: conn.target, connection: conn });
    }
    inDegree.set(conn.target, (inDegree.get(conn.target) ?? 0) + 1);
  }

  // Detect entry components: components with in-degree 0, or client/gateway types if present
  let entryIds = graph.components
    .filter((c) => (c.type === 'client' || c.type === 'gateway') && (inDegree.get(c.id) ?? 0) === 0)
    .map((c) => c.id);

  if (entryIds.length === 0) {
    entryIds = graph.components.filter((c) => (inDegree.get(c.id) ?? 0) === 0).map((c) => c.id);
  }

  // If graph is purely cyclic (no 0-indegree nodes), fall back to all nodes to ensure cycle detection runs
  if (entryIds.length === 0 && graph.components.length > 0) {
    entryIds = graph.components.map((c) => c.id);
  }

  let maxPathLatency = 0;
  let maxLatencyPathConnections: string[] = [];
  let maxLatencyPathComponents: string[] = [];
  let hasMissingLatencyData = false;
  let cycleDetected = false;

  // DFS with recursion stack tracking for cycle detection and longest path calculation
  const visitedOnPath = new Set<string>();

  function dfs(
    currentId: string,
    currentLatency: number,
    currentComponents: string[],
    currentConnections: string[]
  ) {
    if (visitedOnPath.has(currentId)) {
      cycleDetected = true;
      return;
    }

    visitedOnPath.add(currentId);
    const neighbors = adjacency.get(currentId) ?? [];

    if (neighbors.length === 0) {
      if (currentLatency > maxPathLatency) {
        maxPathLatency = currentLatency;
        maxLatencyPathConnections = [...currentConnections];
        maxLatencyPathComponents = [...currentComponents];
      }
    } else {
      for (const { target, connection } of neighbors) {
        const connLatency = connection.latencyMs;
        if (connLatency === undefined) {
          hasMissingLatencyData = true;
        }
        const stepLatency = connLatency ?? 0;

        dfs(
          target,
          currentLatency + stepLatency,
          [...currentComponents, target],
          [...currentConnections, connection.id]
        );
      }
    }

    visitedOnPath.delete(currentId);
  }

  for (const startId of entryIds) {
    dfs(startId, 0, [startId], []);
  }

  if (cycleDetected) {
    findings.push({
      id: 'performance-sync-cycle',
      category: 'performance',
      severity: 'warning',
      title: 'Synchronous cycle detected',
      description: 'The synchronous request path contains a cycle. Static path latency calculation was truncated to prevent infinite recursion.',
      affectedComponentIds: entryIds,
      recommendation: 'Review synchronous dependency graph for recursive or circular synchronous calls.',
    });
  }

  if (hasMissingLatencyData) {
    findings.push({
      id: 'performance-missing-latency',
      category: 'performance',
      severity: 'info',
      title: 'Incomplete connection latency data',
      description: 'One or more synchronous connections do not specify latencyMs. Static path latency estimate assumes 0ms for unmeasured connections.',
      affectedComponentIds: maxLatencyPathComponents,
      affectedConnectionIds: maxLatencyPathConnections,
      metric: 'latencyMs',
      recommendation: 'Specify latencyMs on synchronous connections for accurate static path estimation.',
    });
  }

  if (targetLatencySLA !== undefined && maxPathLatency > 0) {
    if (maxPathLatency > targetLatencySLA) {
      findings.push({
        id: 'performance-sla-violation',
        category: 'performance',
        severity: 'critical',
        title: 'Performance SLA violation in static latency estimate',
        description: `Estimated longest synchronous path latency (${maxPathLatency}ms) exceeds system performance SLA requirement (${targetLatencySLA}ms).`,
        affectedComponentIds: maxLatencyPathComponents,
        affectedConnectionIds: maxLatencyPathConnections,
        metric: 'p95LatencyMs',
        observedValue: maxPathLatency,
        thresholdValue: targetLatencySLA,
        recommendation: 'Optimize component execution time, introduce caching, or convert synchronous calls to async.',
      });
    }
  }

  return findings;
}
