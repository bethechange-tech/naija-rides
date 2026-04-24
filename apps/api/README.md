# @repo/api — NaijaRides API

Express 5 REST API for the NaijaRides carpooling platform, typed end-to-end with OpenAPI.

## Stack

- **Express 5** with [`openapi-backend`](https://github.com/anttiviljami/openapi-backend) for request validation and handler routing
- **Prisma 7** via `@repo/db` for all database access (PostgreSQL / Neon)
- **Vitest** + **Supertest** for integration tests
- **TypeScript 6** with generated types from `openapi-typescript`

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Watch mode — rebuilds and restarts on change |
| `pnpm build` | Generate OpenAPI types + compile to `dist/` |
| `pnpm test` | Run Vitest in watch mode |
| `pnpm test --run` | Run tests once (CI mode) |
| `pnpm seed` | Reset and re-seed the database with Lagos fixture data |
| `pnpm lint` | ESLint |
| `pnpm check-types` | TypeScript type check |

## Architecture

### Request / response flow

```mermaid
flowchart TD
    Client([HTTP Client])

    subgraph Express["Express 5 - app.ts"]
        MW["Rate limiter / Auth middleware / Request ID"]
        OAB["OpenAPI Backend - validates schema + routes"]
    end

    subgraph Handlers["handlers/"]
        H_AUTH["auth.ts - requestOtp / verifyOtp / updateMe"]
        H_RIDES["rides.ts - searchRides / joinRide / createRide / cancelRide / cancelBooking"]
    end

    subgraph Service["NaijaRidesService - naija-rides-db.ts"]
        S_AUTH["OTP issue + verify / token issue"]
        S_RIDES["Ride CRUD / Booking CRUD / Seat lock FOR UPDATE"]
        S_PUB["eventPublisher.publish()"]
    end

    subgraph DB["PostgreSQL via Prisma"]
        T[("auth_tokens / otp_codes / users")]
        R[("rides / ride_bookings / ride_responses")]
    end

    subgraph Bus["events/publisher - RideEventBus"]
        EMIT["emit ride.event"]
    end

    subgraph Consumer["events/consumer - fire and forget"]
        LOG["RideEventLogSubscriber - DB lookup then structured log"]
        STATE["RideStateSubscriber - FOR UPDATE txn - auto-complete / cleanup"]
    end

    Client -->|HTTPS| MW
    MW --> OAB
    OAB --> H_AUTH
    OAB --> H_RIDES
    H_AUTH --> S_AUTH
    H_RIDES --> S_RIDES
    S_AUTH -->|primary write| T
    S_RIDES -->|primary write| R
    S_RIDES --> S_PUB
    S_PUB --> EMIT
    EMIT -.->|void - user already responded| LOG
    EMIT -.->|void - user already responded| STATE
    LOG -->|enriched lookup| R
    LOG -->|enriched lookup| T
    STATE -->|FOR UPDATE txn| R
    S_AUTH --> H_AUTH
    S_RIDES --> H_RIDES
    H_AUTH -->|JSON| Client
    H_RIDES -->|JSON| Client
```

> Solid arrows block the HTTP response. Dashed arrows are fire-and-forget — the client has already received a response before these run.

### Event lifecycle — joinRide

```mermaid
sequenceDiagram
    participant Client
    participant Handler
    participant Service as NaijaRidesService
    participant DB
    participant Bus as RideEventBus
    participant Log as LogSubscriber
    participant State as StateSubscriber

    Client->>Handler: POST /rides/rideId/join
    Handler->>Service: joinRide(rideId)
    Service->>DB: BEGIN / SELECT FOR UPDATE
    DB-->>Service: ride row locked
    Service->>DB: INSERT ride_bookings
    DB-->>Service: booking created
    Service->>DB: COMMIT
    Service->>Bus: emit ride.joined
    Bus-->>Service: sync / instant
    Service-->>Handler: ok true + RideDto
    Handler-->>Client: 200 OK ride DTO

    Note over Log,State: Detached after response sent
    Bus-->>Log: handle ride.joined
    Log->>DB: findUnique ride + user
    DB-->>Log: enriched data
    Log->>Log: console.info structured log

    Bus-->>State: handle ride.joined
    Note over State: no-op for ride.joined
```

### Event lifecycle — cancelBooking

```mermaid
sequenceDiagram
    participant Client
    participant Handler
    participant Service as NaijaRidesService
    participant DB
    participant Bus as RideEventBus
    participant State as StateSubscriber

    Client->>Handler: DELETE /me/rides/rider/bookingId
    Handler->>Service: cancelBooking(bookingId)
    Service->>DB: UPDATE ride_bookings SET cancelled_at
    DB-->>Service: done
    Service->>Bus: emit booking.cancelled
    Bus-->>Service: sync / instant
    Service-->>Handler: ok true
    Handler-->>Client: 204 No Content

    Note over State: Detached after response sent
    Bus-->>State: handle booking.cancelled
    State->>DB: BEGIN / SELECT status FOR UPDATE
    DB-->>State: ride row locked
    State->>DB: COUNT active bookings
    DB-->>State: 0 remaining
    State->>DB: UPDATE rides SET status completed
    DB-->>State: done
    State->>DB: COMMIT
```

### Consumer responsibilities

| Subscriber | Events handled | DB action |
|---|---|---|
| `RideEventLogSubscriber` | All events | Reads ride + actor from DB, emits enriched structured log |
| `RideStateSubscriber` | `booking.cancelled` | `SELECT FOR UPDATE` → auto-complete ride if 0 active bookings remain |
| `RideStateSubscriber` | `ride.cancelled` | Delete future `ride_responses` rows for the ride |

### Race-condition safety

`booking.cancelled` can fire concurrently (e.g. two riders cancel at the same moment). `RideStateSubscriber` guards against double-writes by wrapping the check-and-update in a `db.$transaction` with `SELECT ... FOR UPDATE`, which serializes concurrent handlers at the DB row level. Only the writer that sees `activeBookings === 0` after acquiring the lock will flip the status.

## Project layout

```
src/
  app.ts              Express app factory (registers all routes + subscribers)
  index.ts            Server entrypoint
  seed.ts             Runnable seed CLI
  openapi/            OpenAPI YAML spec
  openapi-types.ts    Auto-generated types (do not edit)
  auth/               Token resolution helpers
  data/
    locations.ts      Lagos location registry with aliases
    naija-rides-db.ts NaijaRidesService + seed/reset helpers
    index.ts          Barrel re-export
  events/
    publisher/        RideEventBus (EventEmitter) · types · publisher class
    consumer/         RideEventLogSubscriber · RideStateSubscriber · registry
  observability/
    metrics.ts        In-process counters (latency, auth failures, join conflicts)
test/
  global-setup.ts     Vitest global setup (Testcontainers / Neon Postgres)
```

## Authentication

The API uses a simple bearer-token scheme backed by the `auth_tokens` table. In test mode (`NODE_ENV=test`) OTP codes are always `1234`.

## Seed data

Running `pnpm seed` calls `resetNaijaRidesData()` which:
1. Clears all NaijaRides rows in dependency order
2. Re-inserts fixture users, rides, bookings, and ride responses

This is also called automatically by `beforeEach` in the test suite.
