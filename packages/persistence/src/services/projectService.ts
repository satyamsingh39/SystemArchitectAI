import { dbPool } from '../db/client';
import type { PoolClient } from 'pg';
import { ProjectRepo } from '../repositories/projectRepo';
import { VersionRepo } from '../repositories/versionRepo';
import { ArchitectureGraphSchema } from '@systemarchitect/architecture-schema';

/**
 * Service handling high‑level project operations.
 * All mutating actions are wrapped in a single PostgreSQL transaction.
 */
export class ProjectService {
  /** Create a new project and its initial version ("1"). */
  static async createProject(name: string): Promise<{ projectId: string; versionId: string }> {
    const client = await dbPool.connect();
    try {
      await client.query('BEGIN');

      // 1️⃣ Insert project (current_version_id = NULL)
      const projectId = await ProjectRepo.create(name, client);

      // 2️⃣ Build an empty ArchitectureGraph matching the canonical schema
      const emptyGraph = ArchitectureGraphSchema.parse({
        id: projectId,
        version: '1',
        components: [],
        connections: [],
        constraints: [],
        trafficFlows: [],
        decisions: [],
        metadata: { createdBy: 'system', createdAt: new Date().toISOString() },
        // requirements omitted – optional
      });

      // 3️⃣ Insert version row (parent_version_id = NULL)
      const versionId = await VersionRepo.create(
        projectId,
        '1',
        emptyGraph,
        null,
        'Initial architecture',
        client
      );

      // 4️⃣ Point project to its initial version
      await ProjectRepo.setCurrentVersion(projectId, versionId, client);

      await client.query('COMMIT');
      return { projectId, versionId };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  /** List all projects (metadata only). */
  static async listProjects(): Promise<any[]> {
    const client = await dbPool.connect();
    try {
      return await ProjectRepo.list(client);
    } finally {
      client.release();
    }
  }

  /** Get a single project by id, including current_version_id. */
  static async getProject(projectId: string): Promise<any | null> {
    const client = await dbPool.connect();
    try {
      return await ProjectRepo.findById(projectId, client);
    } finally {
      client.release();
    }
  }
}
