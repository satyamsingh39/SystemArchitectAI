"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VersionService = void 0;
const client_1 = require("../db/client");
const projectRepo_1 = require("../repositories/projectRepo");
const versionRepo_1 = require("../repositories/versionRepo");
const architecture_schema_1 = require("@systemarchitect/architecture-schema");
/**
 * Service handling version creation, validation and restore.
 * All mutating operations are performed inside a single transaction.
 */
class VersionService {
    /**
     * Save the current in‑memory graph as a new immutable version.
     *
     * @param projectId            id of the project
     * @param graph                ArchitectureGraph supplied by client (may contain any version string)
     * @param message              optional human‑written message
     * @param expectedCurrentVersionId the version id the client believes is current (optimistic concurrency)
     */
    static async createVersion(projectId, graph, message, expectedCurrentVersionId) {
        const client = await client_1.dbPool.connect();
        try {
            await client.query('BEGIN');
            // 1️⃣ Lock the project row to prevent race conditions
            const project = await client.query(`SELECT * FROM projects WHERE id = $1 FOR UPDATE`, [projectId]);
            if (project.rowCount === 0) {
                throw new Error('ProjectNotFound');
            }
            const currentVersionId = project.rows[0].current_version_id;
            // 2️⃣ Optimistic concurrency check
            if (currentVersionId !== expectedCurrentVersionId) {
                throw new Error('StaleVersion');
            }
            // 3️⃣ Validate the incoming graph against the canonical Zod schema
            const validatedGraph = architecture_schema_1.ArchitectureGraphSchema.parse(graph);
            // 4️⃣ Determine next version string (max existing version + 1)
            const versionResult = await client.query(`SELECT version FROM architecture_versions WHERE project_id = $1 ORDER BY (version)::int DESC LIMIT 1`, [projectId]);
            const lastVersion = versionResult.rowCount ? parseInt(versionResult.rows[0].version, 10) : 0;
            const nextVersion = (lastVersion + 1).toString();
            // 5️⃣ Override graph.version with server‑generated version
            validatedGraph.version = nextVersion;
            // 6️⃣ Insert immutable snapshot (parent points to previous current version)
            const versionId = await versionRepo_1.VersionRepo.create(projectId, nextVersion, validatedGraph, currentVersionId || null, message, client);
            // 7️⃣ Update project's current_version_id
            await projectRepo_1.ProjectRepo.setCurrentVersion(projectId, versionId, client);
            await client.query('COMMIT');
            return { versionId, newVersion: nextVersion };
        }
        catch (err) {
            await client.query('ROLLBACK');
            // Re‑throw with a more expressive error type for the API layer
            if (err.message === 'StaleVersion') {
                const e = new Error('Stale version conflict');
                e.status = 409;
                throw e;
            }
            if (err.message === 'ProjectNotFound') {
                const e = new Error('Project not found');
                e.status = 404;
                throw e;
            }
            const e = new Error('Invalid request');
            e.status = 400;
            throw e;
        }
        finally {
            client.release();
        }
    }
    /**
     * Restore a previous version – creates a brand‑new version that copies the target graph.
     */
    static async restoreVersion(projectId, targetVersionId, message, expectedCurrentVersionId) {
        const client = await client_1.dbPool.connect();
        try {
            await client.query('BEGIN');
            // Lock project row
            const project = await client.query(`SELECT * FROM projects WHERE id = $1 FOR UPDATE`, [projectId]);
            if (project.rowCount === 0) {
                throw new Error('ProjectNotFound');
            }
            const currentVersionId = project.rows[0].current_version_id;
            // Optimistic concurrency check
            if (currentVersionId !== expectedCurrentVersionId) {
                throw new Error('StaleVersion');
            }
            // Load the target version graph
            const target = await versionRepo_1.VersionRepo.findById(targetVersionId, client);
            if (!target) {
                const e = new Error('Version not found');
                e.status = 404;
                throw e;
            }
            // Parse and validate the stored JSON (should already be valid, but we re‑validate for safety)
            const parsedGraph = architecture_schema_1.ArchitectureGraphSchema.parse(target.graph);
            // Determine next version string
            const versionResult = await client.query(`SELECT version FROM architecture_versions WHERE project_id = $1 ORDER BY (version)::int DESC LIMIT 1`, [projectId]);
            const lastVersion = versionResult.rowCount ? parseInt(versionResult.rows[0].version, 10) : 0;
            const nextVersion = (lastVersion + 1).toString();
            // Override version field
            parsedGraph.version = nextVersion;
            // Insert a new immutable version – parent points to the version that was current at restore time
            const newVersionId = await versionRepo_1.VersionRepo.create(projectId, nextVersion, parsedGraph, currentVersionId || null, message, client);
            // Update project's current version pointer
            await projectRepo_1.ProjectRepo.setCurrentVersion(projectId, newVersionId, client);
            await client.query('COMMIT');
            return { versionId: newVersionId, newVersion: nextVersion };
        }
        catch (err) {
            await client.query('ROLLBACK');
            if (err.message === 'StaleVersion') {
                const e = new Error('Stale version conflict');
                e.status = 409;
                throw e;
            }
            if (err.message === 'ProjectNotFound') {
                const e = new Error('Project not found');
                e.status = 404;
                throw e;
            }
            const e = new Error('Invalid request');
            e.status = 400;
            throw e;
        }
        finally {
            client.release();
        }
    }
    /** List all versions for a project (metadata only, deterministic order). */
    static async listVersions(projectId) {
        const client = await client_1.dbPool.connect();
        try {
            return await versionRepo_1.VersionRepo.listByProject(projectId, client);
        }
        finally {
            client.release();
        }
    }
    /** Get a specific version row (including full graph). */
    static async getVersionById(projectId, versionId) {
        const client = await client_1.dbPool.connect();
        try {
            const version = await versionRepo_1.VersionRepo.findById(versionId, client);
            if (!version)
                return null;
            // Ensure the version belongs to the requested project
            if (version.project_id !== projectId)
                return null;
            return version;
        }
        finally {
            client.release();
        }
    }
}
exports.VersionService = VersionService;
