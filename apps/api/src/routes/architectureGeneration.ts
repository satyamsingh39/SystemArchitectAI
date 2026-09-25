import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { SystemRequirementsSchema } from '@systemarchitect/architecture-schema';
import { createArchitectureGenerator, ArchitectureProposalSchema } from '@systemarchitect/architecture-generator';

const GenerationRequestSchema = z.object({
  requirements: SystemRequirementsSchema,
});

export function registerArchitectureGenerationRoutes(fastify: FastifyInstance) {
  fastify.post('/api/projects/:projectId/architecture/generate', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { projectId } = request.params as { projectId: string };
      if (!projectId) {
        return reply.status(400).send({ error: 'Missing projectId' });
      }

      const parseResult = GenerationRequestSchema.safeParse(request.body);
      if (!parseResult.success) {
        return reply.status(400).send({ error: 'Invalid requirements', details: parseResult.error.errors });
      }

      const generator = createArchitectureGenerator({
        provider: 'openai', // AI_PROVIDER can be used here too
        model: process.env.AI_MODEL || 'gpt-4o',
        apiKey: process.env.AI_API_KEY,
      });

      const proposal = await generator.generate(parseResult.data.requirements);

      // Level 1: Structured schema validation
      const proposalValidation = ArchitectureProposalSchema.safeParse(proposal);
      if (!proposalValidation.success) {
        return reply.status(500).send({ error: 'Generated proposal failed schema validation', details: proposalValidation.error.errors });
      }

      const validProposal = proposalValidation.data;

      // Level 2: Structural validation
      const componentIds = new Set(validProposal.components.map((c: { id: string }) => c.id));
      
      // Duplicate component IDs
      if (componentIds.size !== validProposal.components.length) {
        return reply.status(500).send({ error: 'Generated proposal contains duplicate component IDs' });
      }

      // Invalid connections
      for (const conn of validProposal.connections) {
        if (!componentIds.has(conn.source)) {
          return reply.status(500).send({ error: `Connection ${conn.id} references non-existent source ${conn.source}` });
        }
        if (!componentIds.has(conn.target)) {
          return reply.status(500).send({ error: `Connection ${conn.id} references non-existent target ${conn.target}` });
        }
      }

      return reply.status(200).send({ proposal: validProposal });
    } catch (error: unknown) {
      fastify.log.error(error);
      const message = error instanceof Error ? error.message : String(error);
      return reply.status(500).send({ error: 'Internal server error during generation', details: message });
    }
  });
}
