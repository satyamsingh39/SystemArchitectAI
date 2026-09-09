// src/tests/requirements_mutations.test.ts
import { describe, expect, it } from 'vitest';
import { ArchitectureEngine } from '../engine';
import type { ArchitectureGraph, SystemRequirements, FunctionalRequirement } from '@systemarchitect/architecture-schema';

function createEmptyGraph(): ArchitectureGraph {
  return {
    id: 'graph-1',
    version: '1',
    components: [],
    connections: [],
    constraints: [],
    trafficFlows: [],
    decisions: [],
    metadata: { name: 'Test Graph' },
  };
}

describe('ArchitectureEngine Requirements & Constraints Mutations', () => {
  it('updates full requirements and increments graph version', () => {
    const engine = new ArchitectureEngine(createEmptyGraph());
    const initialVersion = engine.getGraph().version;

    const requirements: SystemRequirements = {
      functional: [{ id: 'req-1', description: 'User auth', priority: 'must' }],
      scale: { users: 10000, requestsPerSecond: 500 },
      performance: { p95LatencyMs: 200 },
      availability: 99.9,
      consistency: 'strong',
      constraints: ['Data stored in US region'],
    };

    const res = engine.updateRequirements(requirements);
    expect(res.success).toBe(true);
    if (res.success) {
      expect(engine.getRequirements()).toEqual(requirements);
      expect(Number(engine.getGraph().version)).toBe(Number(initialVersion) + 1);
    }
  });

  it('rejects invalid requirements and preserves previous graph state', () => {
    const engine = new ArchitectureEngine(createEmptyGraph());
    const initialGraph = engine.getSnapshot();

    // Invalid availability > 100
    const invalidRequirements = {
      functional: [],
      availability: 150,
    } as unknown as SystemRequirements;

    const res = engine.updateRequirements(invalidRequirements);
    expect(res.success).toBe(false);
    expect(engine.getSnapshot()).toEqual(initialGraph);
  });

  it('adds functional requirement successfully', () => {
    const engine = new ArchitectureEngine(createEmptyGraph());
    const funcReq: FunctionalRequirement = { id: 'fr-1', description: 'Process payments', priority: 'must' };

    const res = engine.addFunctionalRequirement(funcReq);
    expect(res.success).toBe(true);
    expect(engine.getRequirements()?.functional).toHaveLength(1);
    expect(engine.getRequirements()?.functional[0]).toEqual(funcReq);
  });

  it('prevents duplicate functional requirement ID addition', () => {
    const engine = new ArchitectureEngine(createEmptyGraph());
    const funcReq: FunctionalRequirement = { id: 'fr-1', description: 'Process payments', priority: 'must' };

    engine.addFunctionalRequirement(funcReq);
    const duplicateRes = engine.addFunctionalRequirement(funcReq);

    expect(duplicateRes.success).toBe(false);
    expect(engine.getRequirements()?.functional).toHaveLength(1);
  });

  it('removes functional requirement successfully', () => {
    const engine = new ArchitectureEngine(createEmptyGraph());
    const funcReq: FunctionalRequirement = { id: 'fr-1', description: 'Process payments', priority: 'must' };

    engine.addFunctionalRequirement(funcReq);
    const removeRes = engine.removeFunctionalRequirement('fr-1');

    expect(removeRes.success).toBe(true);
    expect(engine.getRequirements()?.functional).toHaveLength(0);
  });

  it('handles removing non-existent functional requirement gracefully', () => {
    const engine = new ArchitectureEngine(createEmptyGraph());
    const removeRes = engine.removeFunctionalRequirement('non-existent');

    expect(removeRes.success).toBe(false);
  });

  it('adds and removes constraints successfully', () => {
    const engine = new ArchitectureEngine(createEmptyGraph());

    const addRes = engine.addConstraint('GDPR Compliance');
    expect(addRes.success).toBe(true);
    expect(engine.getRequirements()?.constraints).toEqual(['GDPR Compliance']);

    const removeRes = engine.removeConstraint(0);
    expect(removeRes.success).toBe(true);
    expect(engine.getRequirements()?.constraints).toEqual([]);
  });

  it('rejects empty constraint strings or out-of-bounds removal', () => {
    const engine = new ArchitectureEngine(createEmptyGraph());

    const emptyAddRes = engine.addConstraint('   ');
    expect(emptyAddRes.success).toBe(false);

    const invalidRemoveRes = engine.removeConstraint(5);
    expect(invalidRemoveRes.success).toBe(false);
  });
});
