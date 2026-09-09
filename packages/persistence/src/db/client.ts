import { Pool } from 'pg';

// Reuse the same pool as used in server.ts
export const dbPool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/systemarchitect',
});
