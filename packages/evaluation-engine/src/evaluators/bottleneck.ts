// src/evaluators/bottleneck.ts
import type { ArchitectureGraph } from '@systemarchitect/architecture-schema';
import type { EvaluationFinding } from '../types/result';

export const BOTTLENECK_WARNING_THRESHOLD = 0.8;
export const BOTTLENECK_CRITICAL_THRESHOLD = 1.0;

export function evaluateBottlenecks(graph: ArchitectureGraph): EvaluationFinding[] {
  const findings: EvaluationFinding[] = [];

  for (const component of graph.components) {
    const capacityRPS = component.capacity?.requestsPerSecond;

    let instanceMultiplier = 1;
    if (component.scaling?.strategy === 'horizontal') {
      instanceMultiplier = component.scaling.maxInstances ?? component.scaling.minInstances ?? 1;
    }

    const effectiveCapacityRPS = capacityRPS !== undefined ? capacityRPS * instanceMultiplier : undefined;

    // Aggregate explicitly defined incoming request rates from connections
    const incomingConnections = graph.connections.filter((c) => c.target === component.id);
    let totalIncomingRate = 0;
    let hasKnownConnectionRate = false;

    for (const conn of incomingConnections) {
      if (conn.requestRate !== undefined) {
        totalIncomingRate += conn.requestRate;
        hasKnownConnectionRate = true;
      }
    }

    if (!hasKnownConnectionRate) {
      if (incomingConnections.length > 0) {
        findings.push({
          id: `bottleneck-missing-rate-${component.id}`,
          category: 'bottleneck',
          severity: 'info',
          title: `Insufficient traffic rate data for ${component.name}`,
          description: `Component '${component.name}' (${component.id}) receives traffic from ${incomingConnections.length} connection(s), but none specify requestRate. Bottleneck utilization cannot be calculated.`,
          affectedComponentIds: [component.id],
          affectedConnectionIds: incomingConnections.map((c) => c.id),
          metric: 'requestRate',
          recommendation: `Define requestRate on incoming connections to '${component.name}' for bottleneck evaluation.`,
        });
      }
      continue;
    }

    if (effectiveCapacityRPS === undefined || effectiveCapacityRPS === 0) {
      findings.push({
        id: `bottleneck-no-capacity-${component.id}`,
        category: 'bottleneck',
        severity: 'warning',
        title: `Unbounded load on ${component.name} without capacity limit`,
        description: `Component '${component.name}' (${component.id}) receives ${totalIncomingRate} RPS incoming traffic, but has no defined capacity limit.`,
        affectedComponentIds: [component.id],
        affectedConnectionIds: incomingConnections.map((c) => c.id),
        metric: 'incomingLoadRPS',
        observedValue: totalIncomingRate,
        recommendation: `Specify requestsPerSecond capacity on component '${component.name}'.`,
      });
      continue;
    }

    const utilization = totalIncomingRate / effectiveCapacityRPS;

    if (utilization >= BOTTLENECK_CRITICAL_THRESHOLD) {
      findings.push({
        id: `bottleneck-overloaded-${component.id}`,
        category: 'bottleneck',
        severity: 'critical',
        title: `Severe bottleneck: ${component.name} overloaded`,
        description: `Component '${component.name}' (${component.id}) incoming traffic (${totalIncomingRate} RPS) exceeds effective capacity (${effectiveCapacityRPS} RPS). Utilization: ${(utilization * 100).toFixed(1)}%.`,
        affectedComponentIds: [component.id],
        affectedConnectionIds: incomingConnections.map((c) => c.id),
        metric: 'utilizationRatio',
        observedValue: Number(utilization.toFixed(2)),
        thresholdValue: BOTTLENECK_CRITICAL_THRESHOLD,
        recommendation: `Scale up component '${component.name}' or reduce incoming connection request rates.`,
      });
    } else if (utilization >= BOTTLENECK_WARNING_THRESHOLD) {
      findings.push({
        id: `bottleneck-warning-${component.id}`,
        category: 'bottleneck',
        severity: 'warning',
        title: `High bottleneck risk on ${component.name}`,
        description: `Component '${component.name}' (${component.id}) utilization is ${(utilization * 100).toFixed(1)}% (${totalIncomingRate} RPS / ${effectiveCapacityRPS} RPS capacity).`,
        affectedComponentIds: [component.id],
        affectedConnectionIds: incomingConnections.map((c) => c.id),
        metric: 'utilizationRatio',
        observedValue: Number(utilization.toFixed(2)),
        thresholdValue: BOTTLENECK_WARNING_THRESHOLD,
        recommendation: `Monitor utilization and prepare horizontal scaling for component '${component.name}'.`,
      });
    }
  }

  return findings;
}
