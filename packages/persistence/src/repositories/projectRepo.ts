import { dbPool } from '../db/client';
import type { PoolClient } from 'pg';
import type { ArchitectureGraph } from '@systemarchitect/architecture-schema';

/**
 * Project repository – low level DB access.
 */
export interface Project {
  id: string;
  name: string;
  current_version_id: string | null;
  created_at: Date;
  updated_at: Date;
}

export class ProjectRepo {
  /** Insert a new project row (current_version_id = NULL). */
  static async create(name: string, client?: PoolClient): Promise<string> {
    const pg = client ?? (await dbPool.connect());
    const result = await pg.query(
      `INSERT INTO projects (name, current_version_id)
       VALUES ($1, NULL)
       RETURNING id`,
      [name]
    );
    if (!client) pg.release();
    return result.rows[0].id;
  }

  /** Find a project by id. */
  static async findById(id: string, client?: PoolClient): Promise<Project | null> {
    const pg = client ?? (await dbPool.connect());
    const result = await pg.query(
      `SELECT id, name, current_version_id, created_at, updated_at FROM projects WHERE id = $1`,
      [id]
    );
    if (!client) pg.release();
    return result.rows[0] ?? null;
  }

  /** List all projects (metadata only). */
  static async list(client?: PoolClient): Promise<Project[]> {
    const pg = client ?? (await dbPool.connect());
    const result = await pg.query(
      `SELECT id, name, current_version_id, created_at, updated_at FROM projects ORDER BY updated_at DESC`
    );
    if (!client) pg.release();
    return result.rows;
  }

  /** Update the current_version_id and updated_at – used inside a transaction. */
  static async setCurrentVersion(projectId: string, versionId: string, client: PoolClient) {
    await client.query(
      `UPDATE projects SET current_version_id = $1, updated_at = now() WHERE id = $2`,
      [versionId, projectId]
    );
  }
}
