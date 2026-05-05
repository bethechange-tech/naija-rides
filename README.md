# NR-Lagos (NaijaRides)

A carpooling platform for Lagos, Nigeria. Drivers post recurring rides; riders search, join, and manage bookings — all matched against Lagos-specific location aliases.

## Monorepo structure

```
apps/
  api/      Express 5 REST API (OpenAPI-backed, TypeScript)
  web/      Next.js frontend
  worker/   Background job worker
packages/
  db/       Prisma schema + shared Prisma client (PostgreSQL)
  queue/    BullMQ queue definitions
  docker-dev/  Local Docker Compose services
```

## Prerequisites

- Node.js 20+
- pnpm 9+
- Docker (for local Postgres) **or** a [Neon](https://neon.tech) project

## Getting started

### 1. Install dependencies

```bash
pnpm install
```

### 2. Set up the database

**Option A — Local Docker**

```bash
cd packages/docker-dev
docker compose up -d postgres
```

Then create `packages/db/.env` from the template:

```bash
cp packages/db/.env.example packages/db/.env
# Edit .env and set the Docker connection strings:
# DATABASE_URL="postgresql://postgres:postgres@localhost:5432/NR_LAGOS_dev?schema=public"
# DIRECT_URL="postgresql://postgres:postgres@localhost:5432/NR_LAGOS_dev?schema=public"
```

**Option B — Neon (cloud)**

```bash
cp packages/db/.env.example packages/db/.env
# Paste your Neon DATABASE_URL (pooled) and DIRECT_URL (direct) into .env
```

### 3. Run migrations

```bash
pnpm --filter @repo/db migrate dev
```

### 4. Seed the database

```bash
pnpm --filter @repo/db seed
# or from the db package directly:
cd packages/db && pnpm seed
```

### 5. Start the API in development mode

```bash
pnpm --filter @repo/api dev
```

The API starts at `http://localhost:3001`. Interactive docs are served at `http://localhost:3001/docs`.

## Running tests

```bash
pnpm --filter @repo/api test --run
```

Tests reset and re-seed the database automatically before each file.

## Environment variables

See [`packages/db/.env.example`](packages/db/.env.example) for all required variables. **Never commit a real `.env` file** — it is git-ignored.

## CI — Neon preview branches

The workflow at [`.github/workflows/neon_workflow.yml`](.github/workflows/neon_workflow.yml) automatically creates a Neon database branch for each pull request and deletes it when the PR is closed. Required repository secrets/variables:

| Name | Type |
|------|------|
| `NEON_API_KEY` | Secret |
| `NEON_PROJECT_ID` | Variable |
