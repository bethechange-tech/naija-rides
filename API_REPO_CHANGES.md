# API Repo Changes

- Pilot auth flow changed to whitelist plus fixed OTP logic for pilot use.
- OTP request rejects non-whitelisted phones with 403.
- OTP verify issues access and refresh tokens.
- Auth now supports either bearer token or auth cookie for protected routes.
- Verify flow now sets auth cookies for browser-style session usage.
- Cookie settings support production options, including optional cookie domain.
- Public and protected path auth gating was formalized in dedicated auth middleware.
- GET me profile behavior and auth profile handling were tightened.
- OpenAPI now documents bearer or cookie auth (explicit OR semantics).
- OpenAPI auth and rides docs were updated to reflect pilot auth behavior and cookie session support.
- Integration and service tests were expanded in BDD style, including cookie auth scenarios.
- Mock-focused auth unit tests were added for MVP pilot behavior.
- Seeder and data reset flow were updated for whitelist and pilot auth data model.
- Prisma schema and migration updates were applied for whitelist and auth token shape evolution.
- Fly deployment setup was added for production, staging, and development configs.
- Environment-specific deploy scripts were added for each Fly config.
- GitHub Actions deploy workflow was added for selecting production, staging, or development.
- Fly secrets were configured for production, development, and staging apps.
- Development and staging Fly apps were created and deployed.
- Local environment separation was added with db env files for development and staging.
- Git ignore rules were tightened to prevent committing env variant files.
- Database migration and seeding operational flow was validated for Neon usage and deployment readiness.

## Differences vs Other Repo

Comparison target: `/Users/rasulomeni/Desktop/naija-rides/api/apps/api`

Reviewed so far (items 1-22):

- Items 1-3 are present in both repos.
- Item 4 differs:
	- This repo supports protected-route auth via bearer **or** cookie.
	- Other repo is bearer-only.
- Item 5 differs:
	- This repo sets auth cookies during OTP verify.
	- Other repo returns tokens in JSON only.
- Item 6 differs:
	- This repo has cookie configuration with production-safe options and optional `AUTH_COOKIE_DOMAIN`.
	- Other repo does not have this cookie options module/logic.
- Item 7 differs:
	- This repo formalizes public/protected auth gating in dedicated modules (`Authoriser` + `PublicPaths`).
	- Other repo keeps equivalent gating inline inside `app.ts` (no dedicated auth middleware module).
- Item 8 differs:
	- This repo tightens `GET /me` handling by returning `404` when profile is missing (while still returning `401` when unauthenticated).
	- Other repo returns `401` for both unauthenticated and missing-profile cases.
- Item 9 differs:
	- This repo OpenAPI documents bearer-or-cookie auth globally (`cookieAuth` scheme + OR security entries).
	- Other repo OpenAPI documents bearer-only auth.
- Item 10 differs:
	- This repo OpenAPI auth/rides path docs were updated for pilot auth and cookie-session behavior (including `Set-Cookie` on verify and cookieAuth on protected endpoints).
	- Other repo auth/rides docs remain bearer-only and do not document cookie-session behavior.
- Item 11 differs:
	- This repo integration/service tests include pilot auth and cookie-auth scenarios (e.g., protected-route access via auth cookie in integration tests).
	- Other repo has BDD-style tests, but does not include cookie-auth integration scenarios.
- Item 12 differs:
	- This repo includes a dedicated mock-focused MVP auth unit suite (`naija-rides-db.mvp-auth.test.ts`).
	- Other repo does not have this dedicated mock-auth unit test file.
- Item 13 is present in both repos:
	- Both repos have seeder + reset flow updates tied to whitelist/pilot-auth data handling.
	- The implementation differs by model naming (`phoneWhitelist` vs `whitelistedPhone`) and transaction style, but both have the behavior.
- Item 14 differs (partially):
	- This repo Prisma schema includes evolved auth token shape (`refreshToken` on `AuthToken`) and renamed whitelist model (`WhitelistedPhone`).
	- Other repo has whitelist migration support (`phone_whitelist`) but does not include the `refreshToken` auth-token schema evolution.
	- Note: this repo migration history does not currently show an explicit migration file for `whitelisted_phones`/`refresh_token`; schema is ahead of migration files.
- Item 15 differs:
	- This repo includes Fly deployment config files for multiple environments (`fly.api.toml`, `fly.api.staging.toml`, `fly.api.dev.toml`).
	- Other repo has no Fly deployment TOML files.
- Item 16 differs:
	- This repo includes environment-specific deploy scripts (`deploy:api:prod|staging|dev`) in root `package.json`.
	- Other repo has no environment-specific deploy scripts.
- Item 17 differs:
	- This repo has a dedicated GitHub Actions Fly deploy workflow with environment selection (`production|staging|development`) in `.github/workflows/fly-deploy.yml`.
	- Other repo has no Fly deploy workflow.
- Item 18 differs (operational):
	- This repo has Fly secrets configured for production, development, and staging app deployments (verified via Fly CLI in this workspace session).
	- Other repo has no Fly deployment setup in-repo, so equivalent multi-environment Fly secrets workflow is not present there.
- Item 19 differs (operational):
	- This repo has production, staging, and development Fly apps created and deployed (`nr-lagos-api`, `nr-lagos-api-staging`, `nr-lagos-api-dev`) verified in this workspace session.
	- Other repo has no Fly app setup in-repo and no evidence of equivalent deployed app trio.
- Item 20 differs:
	- This repo has local DB env separation files (`packages/db/.env.dev`, `packages/db/.env.staging`) plus ignore rules (`packages/db/.env.*`).
	- Other repo only has baseline `packages/db/.env` ignore and no env-specific DB files.
- Item 21 differs:
	- This repo tightened git ignore rules with `packages/db/.env.*` to prevent committing environment-variant DB secret files.
	- Other repo only ignores `packages/db/.env` (no wildcard ignore for env variants).
- Item 22 differs:
	- This repo has validated Neon-oriented migration/seed operational flow for deployment contexts, reflected in env-specific DB prepare scripts (`db:prepare:prod|staging|dev`) and Fly-targeted migrate/seed commands.
	- Other repo provides baseline local/CI migration+seed usage, but does not include this deployment-targeted, env-specific operational flow.

### Missing In Other Repo (Verified)

- Bearer-or-cookie auth on protected endpoints (other repo is bearer-only).
- Cookie issuance on OTP verify (`Set-Cookie` auth session behavior).
- Cookie configuration module with production-safe options and optional `AUTH_COOKIE_DOMAIN`.
- Dedicated auth gating modules (`Authoriser` + `PublicPaths`) instead of inline `app.ts` gating.
- Tightened `GET /me` profile handling (distinct `404` for missing profile).
- OpenAPI global bearer-or-cookie security contract (`cookieAuth` + OR security entries).
- OpenAPI auth/rides docs reflecting pilot auth + cookie-session behavior (including `Set-Cookie` on verify).
- Cookie-auth integration test coverage in API endpoint tests.
- Dedicated mock-focused MVP auth unit test suite (`naija-rides-db.mvp-auth.test.ts`).
- Auth token schema evolution with `refreshToken` on `AuthToken`.
- Fly deployment config files for production/staging/development.
- Environment-specific deploy scripts for Fly (`deploy:api:prod|staging|dev`).
- GitHub Actions Fly deploy workflow with environment selection.
- Operational Fly secrets setup across production/development/staging deployments.
- Operational Fly app setup and deployments across production/staging/development.
- Local DB env separation files (`.env.dev`, `.env.staging`) and matching ignore coverage.
- Tightened env-variant secret ignore rule (`packages/db/.env.*`).
- Deployment-targeted Neon migration/seed operational flow (`db:prepare:*`, `db:migrate:*`, `db:seed:*`).
