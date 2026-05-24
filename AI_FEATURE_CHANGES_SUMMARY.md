# Feature Changes Summary (API)

Source summary copied from the Codex output provided.

## API Changes

- Created backend monorepo under `api/` using pnpm, Turbo, TypeScript, Prisma, and Express.
- Added Express REST API in `api/apps/api`.
- Added OpenAPI-backed routing and generated API types.
- Added API docs endpoint via OpenAPI/Scalar.
- Added auth flow:
  - request OTP
  - verify OTP
  - bearer-token auth
  - `/me` profile endpoint
- Added phone whitelist support for MVP pilot access.
- Added backend-only whitelist script:
  - `pnpm --filter @repo/api whitelist:add -- +2348012345678`
- Added Prisma/Postgres database layer.
- Added DB models and migrations for users, auth tokens, OTPs, rides, bookings, ride responses, and phone whitelist.
- Added ride features:
  - list/search rides
  - create ride
  - join ride
  - cancel ride
  - cancel booking
  - rider/driver ride views
- Added Lagos location data and `/locations` endpoint.
- Added event publisher/consumer setup for ride events.
- Added background worker package.
- Added Redis queue package.
- Added API tests with Vitest/Supertest.
- Added Prisma/Testcontainers test setup.
- Added local Docker Postgres/Redis setup.
- Added CI/Neon workflow files.
- Added production/development DB environment structure with `DATABASE_URL` and `DIRECT_URL`.

