/*
  Migration: 20240909_init_persistence.sql
  Creates the core persistence tables for projects and architecture_versions.
*/

-- Enable uuid generation extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Projects table (current_version_id nullable during creation)
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    current_version_id UUID NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Architecture versions table (immutable snapshots)
CREATE TABLE architecture_versions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    version TEXT NOT NULL,
    parent_version_id UUID NULL REFERENCES architecture_versions(id),
    message TEXT NULL,
    graph JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (project_id, version)
);

-- Add foreign key from projects to its current version (enforced after initial insert)
ALTER TABLE projects
    ADD CONSTRAINT fk_current_version
    FOREIGN KEY (current_version_id)
    REFERENCES architecture_versions(id)
    ON DELETE RESTRICT;

-- Indexes for fast look‑ups
CREATE INDEX idx_arch_versions_project ON architecture_versions(project_id);
CREATE INDEX idx_arch_versions_parent ON architecture_versions(parent_version_id);
