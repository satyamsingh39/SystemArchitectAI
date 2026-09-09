// src/evaluators/reliability.ts
import type { ArchitectureGraph } from '@systemarchitect/architecture-schema';
import type { EvaluationFinding } from '../types/result';

const CRITICAL_TYPES = new Set(['gateway', 'service', 'database', 'auth']);

export function evaluateReliability(graph: ArchitectureGraph): EvaluationFinding[] {
  const findings: EvaluationFinding[] = [];
  const requiredAvailability = graph.requirements?.availability;

  for (const component of graph.components) {
    const isCriticalType = CRITICAL_TYPES.has(component.type);
    const replicas = component.reliability?.replicas ?? 1;
    const strategy = component.scaling?.strategy ?? 'none';

    // A component is a meaningful SPOF candidate if it is a critical type, has 1 replica, no horizontal scaling, AND has incoming/outgoing traffic
    const hasConnections = graph.connections.some(
      (c) => c.source === component.id || c.target === component.id
    );

    if (isCriticalType && replicas === 1 && strategy === 'none' && hasConnections) {
      findings.push({
        id: `reliability-spof-${component.id}`,
        category: 'reliability',
        severity: 'warning',
        title: `Potential Single Point of Failure (SPOF): ${component.name}`,
        description: `Critical component '${component.name}' (${component.type}) operates with single instance/replica (replicas: 1, strategy: none). Failure of this node halts connected traffic.`,
        affectedComponentIds: [component.id],
        metric: 'replicas',
        observedValue: replicas,
        thresholdValue: 2,
        recommendation: `Enable horizontal scaling or configure replicas >= 2 for '${component.name}'.`,
      });
    }

    // Availability target comparison
    const targetAvailability = component.reliability?.availabilityTarget;
    if (requiredAvailability !== undefined && targetAvailability !== undefined) {
      if (targetAvailability < requiredAvailability) {
        findings.push({
          id: `reliability-availability-deficit-${component.id}`,
          category: 'reliability',
          severity: 'critical',
          title: `Availability target deficit for ${component.name}`,
          description: `Component '${component.name}' target availability (${targetAvailability}%) is lower than system requirement (${requiredAvailability}%).`,
          affectedComponentIds: [component.id],
          metric: 'availabilityTarget',
          observedValue: targetAvailability,
          thresholdValue: requiredAvailability,
          recommendation: `Upgrade availability tier or redundancy configuration for '${component.name}'.`,
        });
      }
    }
  }

  // Check synchronous connections for missing fallback or retry failure policies on critical links
  for (const conn of graph.connections) {
    if (conn.type === 'sync' && !conn.failurePolicy?.fallback && !conn.failurePolicy?.retry) {
      const sourceComp = graph.components.find((c) => c.id === conn.source);
      const targetComp = graph.components.find((c) => c.id === conn.target);

      if (sourceComp && targetComp && (CRITICAL_TYPES.has(sourceComp.type) || CRITICAL_TYPES.has(targetComp.type))) {
        findings.push({
          id: `reliability-unhandled-sync-${conn.id}`,
          category: 'reliability',
          severity: 'info',
          title: `Unhandled synchronous link: ${conn.id}`,
          description: `Synchronous connection between '${sourceComp.name}' and '${targetComp.name}' specifies no retry or fallback failure policy.`,
          affectedComponentIds: [conn.source, conn.target],
          affectedConnectionIds: [conn.id],
          metric: 'failurePolicy',
          recommendation: `Configure retry or fallback failurePolicy on connection '${conn.id}'.`,
        });
      }
    }
  }

  return findings;
}
