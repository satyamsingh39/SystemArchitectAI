# SystemArchitect AI

AI-powered system architecture workspace.

## Current Architecture

React UI
    ↓
Fastify API
    ↓
PostgreSQL

The Web frontend and API backend share a common TypeScript package.

## Technology Stack

- **Frontend:** React, TypeScript, Vite, React Flow, Zustand, TanStack Query
- **Backend:** Node.js, TypeScript, Fastify, Zod
- **Database:** PostgreSQL
- **Infrastructure:** Docker, Docker Compose
- **Package Manager:** pnpm

## Repository Structure

```
systemarchitect-ai/
├── apps/
│   ├── web/       # React frontend
│   └── api/       # Fastify backend
├── packages/
│   └── shared/    # Shared TypeScript package
├── database/
│   └── migrations/# Database migrations (future)
└── docs/          # Project documentation
```

## Prerequisites

- Node.js (v20+)
- pnpm
- Docker and Docker Compose

## Installation

```bash
# Install dependencies
pnpm install

# Copy environment variables
cp .env.example .env
```

## Development

Start PostgreSQL:
```bash
docker-compose up -d
```

Start both frontend and backend:
```bash
pnpm run dev
```

Or start individually:
```bash
pnpm --filter web run dev
pnpm --filter api run dev
```

## Health Check
The backend provides a health check at `http://localhost:3000/health`.
