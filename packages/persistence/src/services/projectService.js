"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProjectService = void 0;
const client_1 = require("../db/client");
const projectRepo_1 = require("../repositories/projectRepo");
const versionRepo_1 = require("../repositories/versionRepo");
const architecture_schema_1 = require("@systemarchitect/architecture-schema");
/**
 * Service handling high‑level project operations.
 * All mutating actions are wrapped in a single PostgreSQL transaction.
 */
class ProjectService {
    /** Create a new project and its initial version ("1"). */
    static async createProject(name) {
        const client = await client_1.dbPool.connect();
        try {
            await client.query('BEGIN');
            // 1️⃣ Insert project (current_version_id = NULL)
            const projectId = await projectRepo_1.ProjectRepo.create(name, client);
            // 2️⃣ Build an empty ArchitectureGraph matching the canonical schema
            const emptyGraph = architecture_schema_1.ArchitectureGraphSchema.parse({
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
            const versionId = await versionRepo_1.VersionRepo.create(projectId, '1', emptyGraph, null, 'Initial architecture', client);
            // 4️⃣ Point project to its initial version
            await projectRepo_1.ProjectRepo.setCurrentVersion(projectId, versionId, client);
            await client.query('COMMIT');
            return { projectId, versionId };
        }
        catch (err) {
            await client.query('ROLLBACK');
            throw err;
        }
        finally {
            client.release();
        }
    }
    /** List all projects (metadata only). */
    static async listProjects() {
        const client = await client_1.dbPool.connect();
        try {
            return await projectRepo_1.ProjectRepo.list(client);
        }
        finally {
            client.release();
        }
    }
    /** Get a single project by id, including current_version_id. */
    static async getProject(projectId) {
        const client = await client_1.dbPool.connect();
        try {
            return await projectRepo_1.ProjectRepo.findById(projectId, client);
        }
        finally {
            client.release();
        }
    }
}
exports.ProjectService = ProjectService;
