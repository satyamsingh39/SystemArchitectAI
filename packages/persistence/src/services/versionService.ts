import { dbPool } from '../db/client';
import type { PoolClient } from 'pg';
import { ProjectRepo } from '../repositories/projectRepo';
import { VersionRepo } from '../repositories/versionRepo';
import { ArchitectureGraphSchema } from '@systemarchitect/architecture-schema';
import type { ArchitectureGraph } from '@systemarchitect/architecture-schema';

/**
 * Service handling version creation, validation and restore.
 * All mutating operations are performed inside a single transaction.
 */
export class VersionService {
  /**
   * Save the current in‑memory graph as a new immutable version.
   *
   * @param projectId            id of the project
   * @param graph                ArchitectureGraph supplied by client (may contain any version string)
   * @param message              optional human‑written message
   * @param expectedCurrentVersionId the version id the client believes is current (optimistic concurrency)
   */
  static async createVersion(
    projectId: string,
    graph: ArchitectureGraph,
    message: string | null,
    expectedCurrentVersionId: string
  ): Promise<{ versionId: string; newVersion: string }> {
    const client = await dbPool.connect();
    try {
      await client.query('BEGIN');

      // 1️⃣ Lock the project row to prevent race conditions
      const project = await client.query(
        `SELECT * FROM projects WHERE id = $1 FOR UPDATE`,
        [projectId]
      );
      if (project.rowCount === 0) {
        throw new Error('ProjectNotFound');
      }
      const currentVersionId = project.rows[0].current_version_id as string;

      // 2️⃣ Optimistic concurrency check
      if (currentVersionId !== expectedCurrentVersionId) {
        throw new Error('StaleVersion');
      }

      // 3️⃣ Validate the incoming graph against the canonical Zod schema
      const validatedGraph = ArchitectureGraphSchema.parse(graph);

      // 4️⃣ Determine next version string (max existing version + 1)
      const versionResult = await client.query(
        `SELECT version FROM architecture_versions WHERE project_id = $1 ORDER BY (version)::int DESC LIMIT 1`,
        [projectId]
      );
      const lastVersion = versionResult.rowCount ? parseInt(versionResult.rows[0].version, 10) : 0;
      const nextVersion = (lastVersion + 1).toString();

      // 5️⃣ Override graph.version with server‑generated version
      (validatedGraph as any).version = nextVersion;

      // 6️⃣ Insert immutable snapshot (parent points to previous current version)
      const versionId = await VersionRepo.create(
        projectId,
        nextVersion,
        validatedGraph,
        currentVersionId || null,
        message,
        client
      );

      // 7️⃣ Update project's current_version_id
      await ProjectRepo.setCurrentVersion(projectId, versionId, client);

      await client.query('COMMIT');
      return { versionId, newVersion: nextVersion };
    } catch (err) {
      await client.query('ROLLBACK');
      // Re‑throw with a more expressive error type for the API layer
      if ((err as Error).message === 'StaleVersion') {
        const e: any = new Error('Stale version conflict');
        e.status = 409;
        throw e;
      }
      if ((err as Error).message === 'ProjectNotFound') {
        const e: any = new Error('Project not found');
        e.status = 404;
        throw e;
      }
      const e: any = new Error('Invalid request');
      e.status = 400;
      throw e;
    } finally {
      client.release();
    }
  }

  /**
   * Restore a previous version – creates a brand‑new version that copies the target graph.
   */
  static async restoreVersion(
    projectId: string,
    targetVersionId: string,
    message: string | null,
    expectedCurrentVersionId: string
  ): Promise<{ versionId: string; newVersion: string }> {
    const client = await dbPool.connect();
    try {
      await client.query('BEGIN');

      // Lock project row
      const project = await client.query(
        `SELECT * FROM projects WHERE id = $1 FOR UPDATE`,
        [projectId]
      );
      if (project.rowCount === 0) {
        throw new Error('ProjectNotFound');
      }
      const currentVersionId = project.rows[0].current_version_id as string;

      // Optimistic concurrency check
      if (currentVersionId !== expectedCurrentVersionId) {
        throw new Error('StaleVersion');
      }

      // Load the target version graph
      const target = await VersionRepo.findById(targetVersionId, client);
      if (!target) {
        const e: any = new Error('Version not found');
        e.status = 404;
        throw e;
      }

      // Parse and validate the stored JSON (should already be valid, but we re‑validate for safety)
      const parsedGraph: ArchitectureGraph = ArchitectureGraphSchema.parse(target.graph);

      // Determine next version string
      const versionResult = await client.query(
        `SELECT version FROM architecture_versions WHERE project_id = $1 ORDER BY (version)::int DESC LIMIT 1`,
        [projectId]
      );
      const lastVersion = versionResult.rowCount ? parseInt(versionResult.rows[0].version, 10) : 0;
      const nextVersion = (lastVersion + 1).toString();

      // Override version field
      (parsedGraph as any).version = nextVersion;

      // Insert a new immutable version – parent points to the version that was current at restore time
      const newVersionId = await VersionRepo.create(
        projectId,
        nextVersion,
        parsedGraph,
        currentVersionId || null,
        message,
        client
      );

      // Update project's current version pointer
      await ProjectRepo.setCurrentVersion(projectId, newVersionId, client);

      await client.query('COMMIT');
      return { versionId: newVersionId, newVersion: nextVersion };
    } catch (err) {
      await client.query('ROLLBACK');
      if ((err as Error).message === 'StaleVersion') {
        const e: any = new Error('Stale version conflict');
        e.status = 409;
        throw e;
      }
      if ((err as Error).message === 'ProjectNotFound') {
        const e: any = new Error('Project not found');
        e.status = 404;
        throw e;
      }
      const e: any = new Error('Invalid request');
      e.status = 400;
      throw e;
    } finally {
      client.release();
    }
  }

  /** List all versions for a project (metadata only, deterministic order). */
  static async listVersions(projectId: string): Promise<any[]> {
    const client = await dbPool.connect();
    try {
      return await VersionRepo.listByProject(projectId, client);
    } finally {
      client.release();
    }
  }

  /** Get a specific version row (including full graph). */
  static async getVersionById(projectId: string, versionId: string): Promise<any | null> {
    const client = await dbPool.connect();
    try {
      const version = await VersionRepo.findById(versionId, client);
      if (!version) return null;
      // Ensure the version belongs to the requested project
      if (version.project_id !== projectId) return null;
      return version;
    } finally {
      client.release();
    }
  }
}
