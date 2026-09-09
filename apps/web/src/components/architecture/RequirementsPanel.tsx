// src/components/architecture/RequirementsPanel.tsx
import React, { useState, useEffect } from 'react';
import { useArchitectureStore } from '../../store/architectureStore';
import type {
  SystemRequirements,
  FunctionalRequirementPriority,
  SystemRequirementsConsistency,
} from '@systemarchitect/architecture-schema';

interface Props {
  onClose: () => void;
}

export const RequirementsPanel: React.FC<Props> = ({ onClose }) => {
  const {
    graph,
    updateRequirements,
    addFunctionalRequirement,
    removeFunctionalRequirement,
    addConstraint,
    removeConstraint,
  } = useArchitectureStore();

  const reqs: SystemRequirements = graph.requirements ?? {
    functional: [],
    scale: {},
    performance: {},
    constraints: [],
  };

  // Local Form state for scale, performance, availability, consistency
  const [users, setUsers] = useState<string>(reqs.scale?.users?.toString() ?? '');
  const [concurrentUsers, setConcurrentUsers] = useState<string>(reqs.scale?.concurrentUsers?.toString() ?? '');
  const [requestsPerSecond, setRequestsPerSecond] = useState<string>(reqs.scale?.requestsPerSecond?.toString() ?? '');
  const [dailyRequests, setDailyRequests] = useState<string>(reqs.scale?.dailyRequests?.toString() ?? '');

  const [p50LatencyMs, setP50LatencyMs] = useState<string>(reqs.performance?.p50LatencyMs?.toString() ?? '');
  const [p95LatencyMs, setP95LatencyMs] = useState<string>(reqs.performance?.p95LatencyMs?.toString() ?? '');
  const [p99LatencyMs, setP99LatencyMs] = useState<string>(reqs.performance?.p99LatencyMs?.toString() ?? '');

  const [availability, setAvailability] = useState<string>(reqs.availability?.toString() ?? '');
  const [consistency, setConsistency] = useState<SystemRequirementsConsistency | ''>(reqs.consistency ?? '');

  // Local state for new entries
  const [newFuncDesc, setNewFuncDesc] = useState('');
  const [newFuncPriority, setNewFuncPriority] = useState<FunctionalRequirementPriority>('must');
  const [newConstraintText, setNewConstraintText] = useState('');

  useEffect(() => {
    const current = graph.requirements;
    if (current) {
      setUsers(current.scale?.users?.toString() ?? '');
      setConcurrentUsers(current.scale?.concurrentUsers?.toString() ?? '');
      setRequestsPerSecond(current.scale?.requestsPerSecond?.toString() ?? '');
      setDailyRequests(current.scale?.dailyRequests?.toString() ?? '');

      setP50LatencyMs(current.performance?.p50LatencyMs?.toString() ?? '');
      setP95LatencyMs(current.performance?.p95LatencyMs?.toString() ?? '');
      setP99LatencyMs(current.performance?.p99LatencyMs?.toString() ?? '');

      setAvailability(current.availability?.toString() ?? '');
      setConsistency(current.consistency ?? '');
    }
  }, [graph.requirements]);

  const handleSaveOverview = (e: React.FormEvent) => {
    e.preventDefault();

    const parseNum = (val: string): number | undefined => {
      if (val.trim() === '') return undefined;
      const num = Number(val);
      return isNaN(num) ? undefined : num;
    };

    const updated: SystemRequirements = {
      functional: reqs.functional ?? [],
      scale: {
        users: parseNum(users),
        concurrentUsers: parseNum(concurrentUsers),
        requestsPerSecond: parseNum(requestsPerSecond),
        dailyRequests: parseNum(dailyRequests),
      },
      performance: {
        p50LatencyMs: parseNum(p50LatencyMs),
        p95LatencyMs: parseNum(p95LatencyMs),
        p99LatencyMs: parseNum(p99LatencyMs),
      },
      availability: parseNum(availability),
      consistency: consistency === '' ? undefined : (consistency as SystemRequirementsConsistency),
      constraints: reqs.constraints ?? [],
    };

    updateRequirements(updated);
  };

  const handleAddFunctional = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFuncDesc.trim()) return;
    const id = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `fr-${Date.now()}`;
    addFunctionalRequirement({
      id,
      description: newFuncDesc.trim(),
      priority: newFuncPriority,
    });
    setNewFuncDesc('');
  };

  const handleAddConstraintForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newConstraintText.trim()) return;
    addConstraint(newConstraintText.trim());
    setNewConstraintText('');
  };

  return (
    <div
      style={{
        width: '320px',
        padding: '16px',
        borderLeft: '1px solid #ccc',
        backgroundColor: '#f9f9f9',
        overflowY: 'auto',
        height: '100%',
        boxSizing: 'border-box',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <h3 style={{ margin: 0 }}>System Requirements</h3>
        <button onClick={onClose} style={{ cursor: 'pointer' }}>✕</button>
      </div>

      {/* Scale & SLA Form */}
      <form onSubmit={handleSaveOverview} style={{ marginBottom: '20px', borderBottom: '1px solid #ddd', paddingBottom: '12px' }}>
        <h4>Scale & Performance Targets</h4>

        <div style={{ marginBottom: '8px' }}>
          <label style={{ display: 'block', fontSize: '12px' }}>Total Users:</label>
          <input type="number" value={users} onChange={(e) => setUsers(e.target.value)} style={{ width: '100%' }} />
        </div>

        <div style={{ marginBottom: '8px' }}>
          <label style={{ display: 'block', fontSize: '12px' }}>Concurrent Users:</label>
          <input type="number" value={concurrentUsers} onChange={(e) => setConcurrentUsers(e.target.value)} style={{ width: '100%' }} />
        </div>

        <div style={{ marginBottom: '8px' }}>
          <label style={{ display: 'block', fontSize: '12px' }}>Target Requests/Sec (RPS):</label>
          <input type="number" value={requestsPerSecond} onChange={(e) => setRequestsPerSecond(e.target.value)} style={{ width: '100%' }} />
        </div>

        <div style={{ marginBottom: '8px' }}>
          <label style={{ display: 'block', fontSize: '12px' }}>Daily Requests:</label>
          <input type="number" value={dailyRequests} onChange={(e) => setDailyRequests(e.target.value)} style={{ width: '100%' }} />
        </div>

        <div style={{ marginBottom: '8px' }}>
          <label style={{ display: 'block', fontSize: '12px' }}>p50 Latency (ms):</label>
          <input type="number" value={p50LatencyMs} onChange={(e) => setP50LatencyMs(e.target.value)} style={{ width: '100%' }} />
        </div>

        <div style={{ marginBottom: '8px' }}>
          <label style={{ display: 'block', fontSize: '12px' }}>p95 Latency (ms):</label>
          <input type="number" value={p95LatencyMs} onChange={(e) => setP95LatencyMs(e.target.value)} style={{ width: '100%' }} />
        </div>

        <div style={{ marginBottom: '8px' }}>
          <label style={{ display: 'block', fontSize: '12px' }}>p99 Latency (ms):</label>
          <input type="number" value={p99LatencyMs} onChange={(e) => setP99LatencyMs(e.target.value)} style={{ width: '100%' }} />
        </div>

        <div style={{ marginBottom: '8px' }}>
          <label style={{ display: 'block', fontSize: '12px' }}>Availability Target (%):</label>
          <input type="number" step="0.01" value={availability} onChange={(e) => setAvailability(e.target.value)} style={{ width: '100%' }} />
        </div>

        <div style={{ marginBottom: '8px' }}>
          <label style={{ display: 'block', fontSize: '12px' }}>Consistency Model:</label>
          <select value={consistency} onChange={(e) => setConsistency(e.target.value as SystemRequirementsConsistency | '')} style={{ width: '100%' }}>
            <option value="">(None specified)</option>
            <option value="strong">strong</option>
            <option value="eventual">eventual</option>
            <option value="mixed">mixed</option>
          </select>
        </div>

        <button type="submit" style={{ marginTop: '8px', width: '100%' }}>Save Scale & Targets</button>
      </form>

      {/* Functional Requirements */}
      <div style={{ marginBottom: '20px', borderBottom: '1px solid #ddd', paddingBottom: '12px' }}>
        <h4>Functional Requirements</h4>
        {reqs.functional && reqs.functional.length > 0 ? (
          <ul style={{ paddingLeft: '16px', margin: '4px 0' }}>
            {reqs.functional.map((fr) => (
              <li key={fr.id} style={{ marginBottom: '6px', fontSize: '13px' }}>
                <strong>[{fr.priority.toUpperCase()}]</strong> {fr.description}
                <button
                  onClick={() => removeFunctionalRequirement(fr.id)}
                  style={{ marginLeft: '8px', border: 'none', background: 'transparent', color: 'red', cursor: 'pointer' }}
                  aria-label={`Remove requirement ${fr.id}`}
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <em style={{ fontSize: '12px', color: '#666' }}>No functional requirements added.</em>
        )}

        <form onSubmit={handleAddFunctional} style={{ marginTop: '10px' }}>
          <input
            type="text"
            placeholder="Requirement description..."
            value={newFuncDesc}
            onChange={(e) => setNewFuncDesc(e.target.value)}
            style={{ width: '100%', marginBottom: '4px' }}
          />
          <div style={{ display: 'flex', gap: '4px' }}>
            <select
              value={newFuncPriority}
              onChange={(e) => setNewFuncPriority(e.target.value as FunctionalRequirementPriority)}
              style={{ flex: 1 }}
            >
              <option value="must">must</option>
              <option value="should">should</option>
              <option value="could">could</option>
            </select>
            <button type="submit">Add</button>
          </div>
        </form>
      </div>

      {/* Constraints */}
      <div>
        <h4>System Constraints</h4>
        {reqs.constraints && reqs.constraints.length > 0 ? (
          <ul style={{ paddingLeft: '16px', margin: '4px 0' }}>
            {reqs.constraints.map((c, idx) => (
              <li key={idx} style={{ marginBottom: '6px', fontSize: '13px' }}>
                {c}
                <button
                  onClick={() => removeConstraint(idx)}
                  style={{ marginLeft: '8px', border: 'none', background: 'transparent', color: 'red', cursor: 'pointer' }}
                  aria-label={`Remove constraint ${idx}`}
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <em style={{ fontSize: '12px', color: '#666' }}>No constraints added.</em>
        )}

        <form onSubmit={handleAddConstraintForm} style={{ marginTop: '10px' }}>
          <input
            type="text"
            placeholder="Constraint text..."
            value={newConstraintText}
            onChange={(e) => setNewConstraintText(e.target.value)}
            style={{ width: '100%', marginBottom: '4px' }}
          />
          <button type="submit" style={{ width: '100%' }}>Add Constraint</button>
        </form>
      </div>
    </div>
  );
};
