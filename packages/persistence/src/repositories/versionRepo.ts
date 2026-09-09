import { dbPool } from '../db/client';
import type { PoolClient } from 'pg';
import type { ArchitectureGraph } from '@systemarchitect/architecture-schema';

/**
 * ArchitectureVersion repository – immutable snapshots.
 */
export class VersionRepo {
  /** Insert a new immutable version. Caller must ensure transaction and version string uniqueness. */
  static async create(
    projectId: string,
    version: string,
    graph: ArchitectureGraph,
    parentVersionId: string | null,
    message: string | null,
    client: PoolClient
  ): Promise<string> {
    const result = await client.query(
      `INSERT INTO architecture_versions (project_id, version, parent_version_id, message, graph)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id`,
      [projectId, version, parentVersionId, message, JSON.stringify(graph)]
    );
    return result.rows[0].id;
  }

  /** Find a version by its UUID. */
  static async findById(id: string, client?: PoolClient) {
    const pg = client ?? (await dbPool.connect());
    const result = await pg.query(
      `SELECT * FROM architecture_versions WHERE id = $1`,
      [id]
    );
    if (!client) pg.release();
    return result.rows[0] ?? null;
  }

  /** List versions for a project with deterministic ordering. */
  static async listByProject(projectId: string, client?: PoolClient) {
    const pg = client ?? (await dbPool.connect());
    const result = await pg.query(
      `SELECT id, version, parent_version_id, message, created_at
       FROM architecture_versions
       WHERE project_id = $1
       ORDER BY created_at DESC, (version)::int DESC`,
      [projectId]
    );
    if (!client) pg.release();
    return result.rows;
  }

  /** Get the current version row via project.current_version_id */
  static async getCurrentByProject(projectId: string, client?: PoolClient) {
    const pg = client ?? (await dbPool.connect());
    const result = await pg.query(
      `SELECT av.* FROM architecture_versions av
       JOIN projects p ON p.current_version_id = av.id
       WHERE p.id = $1`,
      [projectId]
    );
    if (!client) pg.release();
    return result.rows[0] ?? null;
  }
}
