/** @vitest-environment node */
// Integration tests for @systemarchitect/persistence using real PostgreSQL
import { config as loadEnv } from 'dotenv';
import path from 'path';

loadEnv({ path: path.resolve(__dirname, '../../../.env') }); // load root .env
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { ProjectService } from '../services/projectService';
import { VersionService } from '../services/versionService';
import { dbPool } from '../db/client';
import { ArchitectureGraphSchema, ArchitectureGraph } from '@systemarchitect/architecture-schema';

function uniqueProjectName() {
  return `test_proj_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
}

async function deleteProjectByName(name: string) {
  const client = await dbPool.connect();
  try {
    await client.query('BEGIN');
    const res = await client.query('SELECT id FROM projects WHERE name = $1', [name]);
    if (res.rowCount) {
      const projectId = res.rows[0].id;
      await client.query('UPDATE projects SET current_version_id = NULL WHERE id = $1', [projectId]);
      await client.query('DELETE FROM architecture_versions WHERE project_id = $1', [projectId]);
      await client.query('DELETE FROM projects WHERE id = $1', [projectId]);
    }
    await client.query('COMMIT');
  } finally {
    client.release();
  }
}

describe('Persistence integration (real PostgreSQL)', async () => {
  let projectName: string;
  let projectId: string;
  let versionIdV1: string;

  beforeAll(async () => {
    projectName = uniqueProjectName();
    const result = await ProjectService.createProject(projectName);
    projectId = result.projectId;
    versionIdV1 = result.versionId;
  });

  afterAll(async () => {
    await deleteProjectByName(projectName);
    await dbPool.end();
  });

  it('PROJECT CREATION: creates project and initial version', async () => {
    const proj = await ProjectService.getProject(projectId);
    expect(proj).not.toBeNull();
    expect(proj?.name).toBe(projectName);
    const v1 = await VersionService.getVersionById(projectId, versionIdV1);
    expect(v1).not.toBeNull();
    expect(v1?.version).toBe('1');
    expect(proj?.current_version_id).toBe(versionIdV1);
  });

  it('VERSION CREATION: create v2 from v1 and verify lineage', async () => {
    const projBefore = await ProjectService.getProject(projectId);
    const currentVersionId = projBefore!.current_version_id as string;
    const baseGraph = ArchitectureGraphSchema.parse({
      id: projectId,
      version: '2',
      components: [
        {
          id: 'c1',
          type: 'service',
          name: 'Comp 1',
          properties: {},
          position: { x: 0, y: 0 },
        },
      ],
      connections: [],
      constraints: [],
      trafficFlows: [],
      decisions: [],
      metadata: { name: projectName, createdAt: new Date().toISOString() },
    });
    const { versionId: v2Id, newVersion } = await VersionService.createVersion(
      projectId,
      baseGraph,
      'Added component',
      currentVersionId
    );
    expect(newVersion).toBe('2');
    const v1 = await VersionService.getVersionById(projectId, versionIdV1);
    expect(v1?.graph.components).toHaveLength(0);
    const projAfter = await ProjectService.getProject(projectId);
    expect(projAfter?.current_version_id).toBe(v2Id);
    const v2CurrentId = projAfter!.current_version_id as string;
    const { versionId: v3Id, newVersion: v3Number } = await VersionService.createVersion(
      projectId,
      baseGraph,
      'Create v3',
      v2CurrentId
    );
    expect(v3Number).toBe('3');
    const v3 = await VersionService.getVersionById(projectId, v3Id);
    expect(v3?.parent_version_id).toBe(v2Id);
  });

  it('IMMUTABILITY: previous snapshots remain unchanged after new version', async () => {
    const proj = await ProjectService.getProject(projectId);
    const currentId = proj!.current_version_id as string;
    const currentVersion = await VersionService.getVersionById(projectId, currentId);
    const originalComponents = currentVersion!.graph.components;
    const newGraph = ArchitectureGraphSchema.parse({
      id: projectId,
      version: '99',
      components: [
        ...originalComponents,
        {
          id: 'c2',
          type: 'service',
          name: 'Comp 2',
          properties: {},
          position: { x: 10, y: 10 },
        },
      ],
      connections: [],
      constraints: [],
      trafficFlows: [],
      decisions: [],
      metadata: { name: projectName, createdAt: new Date().toISOString() },
    });
    const { versionId: vNextId } = await VersionService.createVersion(
      projectId,
      newGraph,
      'Add component',
      currentId
    );
    const prevVersion = await VersionService.getVersionById(projectId, currentId);
    expect(prevVersion?.graph.components).toEqual(originalComponents);
    const nextVersion = await VersionService.getVersionById(projectId, vNextId);
    expect(nextVersion?.graph.components).toHaveLength(originalComponents.length + 1);
  });

  it('OPTIMISTIC CONCURRENCY: stale version rejection', async () => {
    const proj = await ProjectService.getProject(projectId);
    const correctCurrent = proj!.current_version_id as string;
    const staleId = versionIdV1;
    const dummyGraph = ArchitectureGraphSchema.parse({
      id: projectId,
      version: '99',
      components: [],
      connections: [],
      constraints: [],
      trafficFlows: [],
      decisions: [],
      metadata: { name: projectName, createdAt: new Date().toISOString() },
    });
    await expect(
      VersionService.createVersion(projectId, dummyGraph, 'stale attempt', staleId)
    ).rejects.toMatchObject({ status: 409 });
    const after = await ProjectService.getProject(projectId);
    expect(after!.current_version_id).toBe(correctCurrent);
  });

  it('RESTORE: restore earlier version creates new version with correct lineage', async () => {
    const proj = await ProjectService.getProject(projectId);
    const currentId = proj!.current_version_id as string;
    const v1 = await VersionService.getVersionById(projectId, versionIdV1);
    expect(v1).not.toBeNull();
    const { versionId: restoredId, newVersion } = await VersionService.restoreVersion(
      projectId,
      versionIdV1,
      'Restore to v1',
      currentId
    );
    // After creating v2, v3, and v4 earlier, next version should be "5"
    expect(newVersion).toBe('5');
    const restored = await VersionService.getVersionById(projectId, restoredId);
    expect(restored?.graph).toEqual({ ...v1?.graph, version: '5' });
    const afterRestore = await ProjectService.getProject(projectId);
    expect(afterRestore!.current_version_id).toBe(restoredId);
    expect(restored?.parent_version_id).toBe(currentId);
  });

  it('GRAPH VALIDATION: invalid graph is rejected', async () => {
    const proj = await ProjectService.getProject(projectId);
    const currentId = proj!.current_version_id as string;
    const invalidGraph = {
      id: projectId,
      version: '99',
      components: [{ id: 'cX', type: 'Component', name: 123 }],
      connections: [],
      constraints: [],
      trafficFlows: [],
      decisions: [],
      metadata: { createdBy: 'test', createdAt: new Date().toISOString() }
    };
    await expect(
      VersionService.createVersion(projectId, invalidGraph as unknown as ArchitectureGraph, 'invalid', currentId)
    ).rejects.toMatchObject({ status: 400 });
  });

  it('TRANSACTIONAL BEHAVIOR: failed version creation rolls back current pointer', async () => {
    const proj = await ProjectService.getProject(projectId);
    const currentId = proj!.current_version_id as string;
    const badGraph = {
      id: projectId,
      version: '99',
      components: [{ id: 'bad', type: 'Component', name: 123 }],
      connections: [],
      constraints: [],
      trafficFlows: [],
      decisions: [],
      metadata: { createdBy: 'test', createdAt: new Date().toISOString() }
    };
    await expect(
      VersionService.createVersion(projectId, badGraph as unknown as ArchitectureGraph, 'bad', currentId)
    ).rejects.toMatchObject({ status: 400 });
    const after = await ProjectService.getProject(projectId);
    expect(after!.current_version_id).toBe(currentId);
  });
});
