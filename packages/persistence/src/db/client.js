"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dbPool = void 0;
const pg_1 = require("pg");
// Reuse the same pool as used in server.ts
exports.dbPool = new pg_1.Pool({
    connectionString: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/systemarchitect',
});
