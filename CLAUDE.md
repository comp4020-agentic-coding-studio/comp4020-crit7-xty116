# Roomline working agreement

Build a narrow, believable replacement for the frustrating part of ANU room
booking: finding a suitable room and knowing whether a booking actually worked.

## Product rules

- Keep the primary path on one screen: set a time and requirements, compare
  rooms, book one, then see or cancel the booking.
- Treat overlap prevention and reload persistence as product behaviour, not
  interface decoration. Validate them on the server and cover them by HTTP
  contract tests.
- Use representative room data and say so. Do not imply access to live ANU
  inventory, identity, or policy systems.
- Explain errors in the user's terms and preserve their selected search after
  a failed booking.
- Make the no-JavaScript form path usable; JavaScript may improve feedback and
  live updates but cannot be the only way to complete the core flow.

## Engineering rules

- Keep SQLite as the single source of truth and change it only through Drizzle
  schema plus committed migrations.
- Store times as date plus integer minutes and reject an interval when
  `existing.start < requested.end` and `existing.end > requested.start`.
- Keep `fly.toml`, the Docker deployment shape, supplied invariant tests, and
  `/readme/` contract intact.
- Add each public page to `spec/routes.ts`; test contracts through the running
  production build.
- Run `pnpm check` and `pnpm check:evidence` before deployment. Never commit
  credentials, local databases, build output, or `mise.local.toml`.

## Experience rules

- Optimise first for 1920x1080 and 390x844 without hiding essential actions.
- Use semantic landmarks, explicit labels, visible keyboard focus, useful empty
  states, and status messages announced with `aria-live`.
- Prefer a calm timetable-like interface over a marketing page. Density should
  aid comparison; colour must communicate availability, not decorate it.
