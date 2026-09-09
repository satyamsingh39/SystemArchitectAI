// src/engine.ts
import type { ArchitectureGraph } from '@systemarchitect/architecture-schema';
import type { EvaluationFinding, EvaluationResult, EvaluationSummary } from './types/result';
import { evaluateScalability } from './evaluators/scalability';
import { evaluateBottlenecks } from './evaluators/bottleneck';
import { evaluatePerformance } from './evaluators/performance';
import { evaluateReliability } from './evaluators/reliability';

export class EvaluationEngine {
  public static evaluate(graph: ArchitectureGraph): EvaluationResult {
    const scalabilityFindings = evaluateScalability(graph);
    const bottleneckFindings = evaluateBottlenecks(graph);
    const performanceFindings = evaluatePerformance(graph);
    const reliabilityFindings = evaluateReliability(graph);

    const allFindings: EvaluationFinding[] = [
      ...scalabilityFindings,
      ...bottleneckFindings,
      ...performanceFindings,
      ...reliabilityFindings,
    ];

    // Deterministic sorting order: category -> severity -> component ID -> finding ID
    const categoryOrder: Record<string, number> = {
      scalability: 1,
      bottleneck: 2,
      performance: 3,
      reliability: 4,
    };

    const severityOrder: Record<string, number> = {
      critical: 1,
      warning: 2,
      info: 3,
    };

    allFindings.sort((a, b) => {
      const catDiff = (categoryOrder[a.category] ?? 99) - (categoryOrder[b.category] ?? 99);
      if (catDiff !== 0) return catDiff;

      const sevDiff = (severityOrder[a.severity] ?? 99) - (severityOrder[b.severity] ?? 99);
      if (sevDiff !== 0) return sevDiff;

      const aComp = a.affectedComponentIds[0] ?? '';
      const bComp = b.affectedComponentIds[0] ?? '';
      const compDiff = aComp.localeCompare(bComp);
      if (compDiff !== 0) return compDiff;

      return a.id.localeCompare(b.id);
    });

    let criticalCount = 0;
    let warningCount = 0;
    let infoCount = 0;

    for (const f of allFindings) {
      if (f.severity === 'critical') criticalCount++;
      else if (f.severity === 'warning') warningCount++;
      else if (f.severity === 'info') infoCount++;
    }

    const summary: EvaluationSummary = {
      totalFindings: allFindings.length,
      criticalCount,
      warningCount,
      infoCount,
      isCompliant: criticalCount === 0,
    };

    return {
      graphId: graph.id,
      graphVersion: graph.version,
      findings: allFindings,
      summary,
    };
  }
}
