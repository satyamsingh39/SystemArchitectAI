// src/evaluators/scalability.ts
import type { ArchitectureGraph } from '@systemarchitect/architecture-schema';
import type { EvaluationFinding } from '../types/result';

export function evaluateScalability(graph: ArchitectureGraph): EvaluationFinding[] {
  const findings: EvaluationFinding[] = [];
  const requiredRPS = graph.requirements?.scale?.requestsPerSecond;

  for (const component of graph.components) {
    const capacityRPS = component.capacity?.requestsPerSecond;

    if (requiredRPS === undefined) {
      continue;
    }

    if (capacityRPS === undefined) {
      findings.push({
        id: `scalability-missing-${component.id}`,
        category: 'scalability',
        severity: 'info',
        title: `Missing capacity metric for ${component.name}`,
        description: `Component '${component.name}' (${component.id}) does not define requestsPerSecond capacity. Workload compliance cannot be calculated.`,
        affectedComponentIds: [component.id],
        metric: 'requestsPerSecond',
        recommendation: `Specify requestsPerSecond capacity on component '${component.name}' to enable workload validation.`,
      });
      continue;
    }

    let instanceMultiplier = 1;
    if (component.scaling?.strategy === 'horizontal') {
      instanceMultiplier = component.scaling.maxInstances ?? component.scaling.minInstances ?? 1;
    }

    const effectiveCapacityRPS = capacityRPS * instanceMultiplier;

    if (effectiveCapacityRPS < requiredRPS) {
      const severity = effectiveCapacityRPS < requiredRPS * 0.5 ? 'critical' : 'warning';
      findings.push({
        id: `scalability-deficit-${component.id}`,
        category: 'scalability',
        severity,
        title: `Workload capacity deficit for ${component.name}`,
        description: `Effective capacity of '${component.name}' (${effectiveCapacityRPS} RPS) is lower than system requirement (${requiredRPS} RPS).`,
        affectedComponentIds: [component.id],
        metric: 'requestsPerSecond',
        observedValue: effectiveCapacityRPS,
        thresholdValue: requiredRPS,
        recommendation: `Increase instance count or per-instance capacity for '${component.name}'.`,
      });
    }
  }

  return findings;
}
