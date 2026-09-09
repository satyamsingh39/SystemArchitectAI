"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VersionRepo = void 0;
const client_1 = require("../db/client");
/**
 * ArchitectureVersion repository – immutable snapshots.
 */
class VersionRepo {
    /** Insert a new immutable version. Caller must ensure transaction and version string uniqueness. */
    static async create(projectId, version, graph, parentVersionId, message, client) {
        const result = await client.query(`INSERT INTO architecture_versions (project_id, version, parent_version_id, message, graph)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id`, [projectId, version, parentVersionId, message, JSON.stringify(graph)]);
        return result.rows[0].id;
    }
    /** Find a version by its UUID. */
    static async findById(id, client) {
        const pg = client ?? (await client_1.dbPool.connect());
        const result = await pg.query(`SELECT * FROM architecture_versions WHERE id = $1`, [id]);
        if (!client)
            pg.release();
        return result.rows[0] ?? null;
    }
    /** List versions for a project with deterministic ordering. */
    static async listByProject(projectId, client) {
        const pg = client ?? (await client_1.dbPool.connect());
        const result = await pg.query(`SELECT id, version, parent_version_id, message, created_at
       FROM architecture_versions
       WHERE project_id = $1
       ORDER BY created_at DESC, (version)::int DESC`, [projectId]);
        if (!client)
            pg.release();
        return result.rows;
    }
    /** Get the current version row via project.current_version_id */
    static async getCurrentByProject(projectId, client) {
        const pg = client ?? (await client_1.dbPool.connect());
        const result = await pg.query(`SELECT av.* FROM architecture_versions av
       JOIN projects p ON p.current_version_id = av.id
       WHERE p.id = $1`, [projectId]);
        if (!client)
            pg.release();
        return result.rows[0] ?? null;
    }
}
exports.VersionRepo = VersionRepo;
