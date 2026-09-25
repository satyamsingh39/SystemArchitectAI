import Fastify from "fastify";
import { Pool } from "pg";
import { SYSTEM_NAME, HealthCheckResponse } from "@systemarchitect/shared";
import { registerPersistenceRoutes } from "./routes/persistence";
import { registerArchitectureGenerationRoutes } from "./routes/architectureGeneration";

const fastify = Fastify({ logger: true });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgres://postgres:postgres@localhost:5432/systemarchitect",
});

fastify.get("/health", async (request, reply): Promise<HealthCheckResponse> => {
  try {
    // Check database connectivity
    await pool.query("SELECT 1");
    return { status: "ok" };
  } catch (error) {
    fastify.log.error(error);
    reply.status(500);
    return { status: "error" };
  }
});

// Register API routes for persistence
registerPersistenceRoutes(fastify);
registerArchitectureGenerationRoutes(fastify);

const start = async () => {
  try {
    console.log(`Starting ${SYSTEM_NAME} API...`);
    await fastify.listen({ port: 3000, host: "0.0.0.0" });
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
