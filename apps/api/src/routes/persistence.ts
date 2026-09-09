import { FastifyInstance } from 'fastify';
import { ProjectService } from '@systemarchitect/persistence/src/services/projectService';
import { VersionService } from '@systemarchitect/persistence/src/services/versionService';
import { ArchitectureGraphSchema } from '@systemarchitect/architecture-schema';

/**
 * Register persistence‑related routes.
 * All routes return JSON and map internal errors to appropriate HTTP status codes.
 */
export async function registerPersistenceRoutes(app: FastifyInstance) {
  // ---------- Projects ----------
  app.post('/api/projects', async (request, reply) => {
    const { name } = request.body as { name: string };
    if (!name) {
      reply.status(400).send({ error: 'Missing project name' });
      return;
    }
    try {
      const { projectId, versionId } = await ProjectService.createProject(name);
      reply.status(201).send({ projectId, versionId });
    } catch (err) {
      reply.status(500).send({ error: 'Failed to create project' });
    }
  });

  app.get('/api/projects', async (request, reply) => {
    try {
      const projects = await ProjectService.listProjects();
      reply.send(projects);
    } catch (err) {
      reply.status(500).send({ error: 'Failed to list projects' });
    }
  });

  app.get('/api/projects/:projectId', async (request, reply) => {
    const { projectId } = request.params as { projectId: string };
    try {
      const project = await ProjectService.getProject(projectId);
      if (!project) return reply.status(404).send({ error: 'Project not found' });
      reply.send(project);
    } catch (err) {
      reply.status(500).send({ error: 'Failed to fetch project' });
    }
  });

  // ---------- Versions ----------
  app.get('/api/projects/:projectId/versions', async (request, reply) => {
    const { projectId } = request.params as { projectId: string };
    try {
      const versions = await VersionService.listVersions(projectId);
      reply.send(versions);
    } catch (err) {
      reply.status(500).send({ error: 'Failed to list versions' });
    }
  });

  app.get('/api/projects/:projectId/versions/:versionId', async (request, reply) => {
    const { projectId, versionId } = request.params as { projectId: string; versionId: string };
    try {
      const version = await VersionService.getVersionById(projectId, versionId);
      if (!version) return reply.status(404).send({ error: 'Version not found' });
      reply.send({ graph: version.graph });
    } catch (err) {
      reply.status(500).send({ error: 'Failed to fetch version' });
    }
  });

  app.post('/api/projects/:projectId/versions', async (request, reply) => {
    const { projectId } = request.params as { projectId: string };
    const { graph, message = null, expectedCurrentVersionId } = request.body as {
      graph: unknown;
      message?: string | null;
      expectedCurrentVersionId: string;
    };
    if (!expectedCurrentVersionId) {
      reply.status(400).send({ error: 'expectedCurrentVersionId required' });
      return;
    }
    try {
      // Validate shape via Zod – will throw if invalid
      const validatedGraph = ArchitectureGraphSchema.parse(graph);
      const result = await VersionService.createVersion(
        projectId,
        validatedGraph,
        message,
        expectedCurrentVersionId
      );
      reply.status(201).send(result);
    } catch (err: any) {
      const status = err.status || (err.message?.includes('Stale') ? 409 : 400);
      reply.status(status).send({ error: err.message || 'Invalid request' });
    }
  });

  app.post('/api/projects/:projectId/versions/:versionId/restore', async (request, reply) => {
    const { projectId, versionId } = request.params as { projectId: string; versionId: string };
    const { message = null, expectedCurrentVersionId } = request.body as {
      message?: string | null;
      expectedCurrentVersionId: string;
    };
    if (!expectedCurrentVersionId) {
      reply.status(400).send({ error: 'expectedCurrentVersionId required' });
      return;
    }
    try {
      const result = await VersionService.restoreVersion(
        projectId,
        versionId,
        message,
        expectedCurrentVersionId
      );
      reply.status(201).send(result);
    } catch (err: any) {
      const status = err.status || (err.message?.includes('Stale') ? 409 : 400);
      reply.status(status).send({ error: err.message || 'Invalid request' });
    }
  });
}
