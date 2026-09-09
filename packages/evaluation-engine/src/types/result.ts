// src/types/result.ts

export type FindingSeverity = 'info' | 'warning' | 'critical';

export type FindingCategory = 'scalability' | 'bottleneck' | 'performance' | 'reliability';

export interface EvaluationFinding {
  id: string;
  category: FindingCategory;
  severity: FindingSeverity;
  title: string;
  description: string;
  affectedComponentIds: string[];
  affectedConnectionIds?: string[];
  metric?: string;
  observedValue?: number | string;
  thresholdValue?: number | string;
  recommendation?: string;
}

export interface EvaluationSummary {
  totalFindings: number;
  criticalCount: number;
  warningCount: number;
  infoCount: number;
  isCompliant: boolean;
}

export interface EvaluationResult {
  graphId: string;
  graphVersion: string;
  findings: EvaluationFinding[];
  summary: EvaluationSummary;
}
