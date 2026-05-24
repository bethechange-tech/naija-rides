# NaijaRides Mobile Backend Go-Live Todo

Source: Mohammed Laniyan, "NaijaRides Mobile - Backend changes needed before live switch", Thu 21 May.

## Required Before Go-Live

- [x] Add `Sat` and `Sun` to the `repeatDays` enum.
  - Update `openapi/schemas/rides.yaml`.
  - Update the Prisma `RepeatDay` enum.
  - Run and commit a database migration.

- [x] Add optional `day` query parameter to `GET /rides/search`.
  - Allowed values: `Mon | Tue | Wed | Thu | Fri | Sat | Sun`.
  - When provided, only return rides where `repeatDays` includes that day.
  - Example: `GET /rides/search?from=Yaba&to=Victoria Island&day=Wed`.

- [x] Include `repeatDays: string[]` in My Rides responses.
  - Add to `GET /me/rides/rider` items.
  - Add to `GET /me/rides/driver` items.
  - Needed by the app to display labels like `Weekdays` or `Mon · Wed · Fri`.

- [x] Exclude the driver's own rides from `GET /rides/search`.
  - Update `searchActiveRides`.
  - Filter out rides where `driverUserId === currentUserId`.

- [x] Add `GET /me`.
  - Return the authenticated user's profile.
  - Response shape: `{ phone, name, company }`.
  - Needed so a user can fetch their profile on a new device.

## Search Quality Improvement

- [x] Make location alias matching bidirectional in `searchActiveRides`.
  - Update `matchesLocation` in `apps/api/src/data/naija-rides-db.ts`.
  - Normalize both stored ride locations and search queries through `LAGOS_LOCATIONS`.
  - This should make `VI` match `Victoria Island` in both directions.

Suggested implementation:

```ts
const expandLocation = (str: string): string[] => {
  const lower = str.trim().toLowerCase();
  const byName = LAGOS_LOCATIONS.find((l) => l.name.toLowerCase() === lower);
  if (byName) return [lower, ...byName.aliases.map((a) => a.toLowerCase())];
  const byAlias = LAGOS_LOCATIONS.find((l) =>
    l.aliases.some((a) => a.toLowerCase() === lower)
  );
  if (byAlias) return [byAlias.name.toLowerCase(), ...byAlias.aliases.map((a) => a.toLowerCase())];
  return [lower];
};

const matchesLocation = (rideLocation: string, query: string): boolean => {
  const rideForms = expandLocation(rideLocation);
  const queryForms = expandLocation(query);
  return rideForms.some((r) => queryForms.some((q) => r.includes(q) || q.includes(r)));
};
```

## Before Production

- [x] Replace console-logged OTP codes with real SMS delivery.
  - Current behavior logs OTPs with `console.log("[otp] OTP for...")`.
  - Use Termii, Twilio, or another SMS provider suitable for Nigerian numbers.
  - Keep the `/auth/otp/request` API contract unchanged.

## Termii SMS Provider Todo

- [ ] Create a dedicated Termii project for NaijaRides production.
  - Keep project name/environment clear (for example: NaijaRides Prod).

- [ ] Generate and store a production Termii API key.
  - Save securely in your secrets manager.
  - Do not commit API keys to the repository.

- [ ] Configure and verify sender identity in Termii.
  - Ensure `TERMII_SENDER_ID` is approved and allowed for OTP traffic.
  - Confirm sender ID format and length accepted by Termii.

- [ ] Set required API environment variables in production.
  - `SMS_PROVIDER=termii`
  - `TERMII_API_KEY=<production key>`
  - `TERMII_SENDER_ID=<approved sender id>`

- [ ] Set optional Termii environment variables (only if needed).
  - `TERMII_CHANNEL=dnd` (default in code is `dnd` if omitted).
  - `TERMII_SMS_ENDPOINT` only if you need a non-default endpoint.

- [ ] Add the same variables in staging and verify behavior before prod rollout.
  - Send test OTP requests to real Nigerian numbers.
  - Confirm delivery time and message formatting.

- [ ] Validate production fallback behavior and error visibility.
  - Confirm app no longer depends on OTP logs.
  - Ensure failed SMS attempts are observable in logs/alerts.

- [ ] Run final smoke tests after deployment.
  - Request OTP from mobile app.
  - Complete login with received OTP.
  - Repeat test with at least two different carriers.
