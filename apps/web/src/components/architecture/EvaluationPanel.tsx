// src/components/architecture/EvaluationPanel.tsx
import React, { useState } from 'react';
import { useArchitectureStore } from '../../store/architectureStore';
import { EvaluationEngine } from '@systemarchitect/evaluation-engine';
import type { EvaluationResult, FindingSeverity } from '@systemarchitect/evaluation-engine';

interface Props {
  onClose: () => void;
}

export const EvaluationPanel: React.FC<Props> = ({ onClose }) => {
  const { graph, selectComponent } = useArchitectureStore();
  const [result, setResult] = useState<EvaluationResult | undefined>(undefined);

  const handleRunEvaluation = () => {
    const evalResult = EvaluationEngine.evaluate(graph);
    setResult(evalResult);
  };

  const severityColor = (sev: FindingSeverity) => {
    switch (sev) {
      case 'critical':
        return '#b71c1c';
      case 'warning':
        return '#e65100';
      case 'info':
        return '#0277bd';
    }
  };

  const severityBg = (sev: FindingSeverity) => {
    switch (sev) {
      case 'critical':
        return '#ffebee';
      case 'warning':
        return '#fff3e0';
      case 'info':
        return '#e1f5fe';
    }
  };

  return (
    <div
      style={{
        width: '320px',
        padding: '16px',
        borderLeft: '1px solid #ccc',
        backgroundColor: '#fafafa',
        overflowY: 'auto',
        height: '100%',
        boxSizing: 'border-box',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <h3 style={{ margin: 0 }}>Evaluation Engine</h3>
        <button onClick={onClose} style={{ cursor: 'pointer' }}>✕</button>
      </div>

      <button
        onClick={handleRunEvaluation}
        style={{
          width: '100%',
          padding: '8px',
          backgroundColor: '#1976d2',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          fontWeight: 'bold',
          marginBottom: '16px',
        }}
      >
        Run Static Evaluation
      </button>

      {result ? (
        <div>
          {/* Summary Box */}
          <div
            style={{
              padding: '10px',
              borderRadius: '4px',
              backgroundColor: result.summary.isCompliant ? '#e8f5e9' : '#ffebee',
              border: `1px solid ${result.summary.isCompliant ? '#81c784' : '#e57373'}`,
              marginBottom: '16px',
            }}
          >
            <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
              Compliance: {result.summary.isCompliant ? '✓ PASSED' : '✕ VIOLATIONS DETECTED'}
            </div>
            <div style={{ fontSize: '12px', color: '#555' }}>
              Findings: {result.summary.totalFindings} (Critical: {result.summary.criticalCount}, Warning: {result.summary.warningCount}, Info: {result.summary.infoCount})
            </div>
          </div>

          {/* Findings List */}
          {result.findings.length === 0 ? (
            <div style={{ fontSize: '13px', color: '#666' }}>No findings. Architecture satisfies requirements.</div>
          ) : (
            result.findings.map((f) => (
              <div
                key={f.id}
                style={{
                  padding: '10px',
                  borderRadius: '4px',
                  backgroundColor: severityBg(f.severity),
                  borderLeft: `4px solid ${severityColor(f.severity)}`,
                  marginBottom: '10px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', color: severityColor(f.severity) }}>
                    [{f.category}] {f.severity}
                  </span>
                </div>
                <div style={{ fontWeight: 'bold', fontSize: '13px', marginBottom: '4px' }}>{f.title}</div>
                <div style={{ fontSize: '12px', color: '#333', marginBottom: '6px' }}>{f.description}</div>
                {f.affectedComponentIds.length > 0 && (
                  <div style={{ fontSize: '11px', color: '#666', marginBottom: '4px' }}>
                    Affected Components:{' '}
                    {f.affectedComponentIds.map((id) => (
                      <button
                        key={id}
                        onClick={() => selectComponent(id)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#1976d2',
                          textDecoration: 'underline',
                          cursor: 'pointer',
                          padding: 0,
                          fontSize: '11px',
                          marginRight: '6px',
                        }}
                      >
                        {id}
                      </button>
                    ))}
                  </div>
                )}
                {f.recommendation && (
                  <div style={{ fontSize: '11px', fontStyle: 'italic', color: '#444' }}>
                    💡 {f.recommendation}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      ) : (
        <em style={{ fontSize: '12px', color: '#666' }}>Click button above to evaluate current architecture graph.</em>
      )}
    </div>
  );
};
