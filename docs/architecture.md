# SystemArchitect AI Architecture

## Core Architectural Principle

"The architecture graph is the source of truth.
The React Flow canvas is a visualization/editor of that graph.
The AI agent operates on the graph through controlled tools."

## High-Level Architecture

```
React UI
    ↓
Fastify API
    ↓
PostgreSQL
```

### Shared Packages

```
Web + API
    ↓
Shared TypeScript package
```

The `packages/shared` package contains shared code like types, validation schemas, and constants, which are imported by both the React UI and the Fastify API.
