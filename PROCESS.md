# Process overview

## What I built

Roomline is a full-stack replacement for the uncertain middle of ANU room
booking. It lets a group describe a session, compare representative rooms,
reserve an available interval, and cancel it later. SQLite on the Fly volume is
the source of truth, so bookings survive refreshes and redeploys.

## How I got here

The brief was broad and the direction I gave the agent was deliberately open:

> “OK就这么做全权交给你了”

I first grounded that freedom in the published Crit 7 contract and the starter's
deployment constraints. I converted the product judgement into explicit rules
in `CLAUDE.md`: one-screen completion, honest representative data, server-side
conflict handling, progressive enhancement, and mobile accessibility. Before
implementation, [`a6b2db1`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit7-xty116/commit/a6b2db1)
replaced the guestbook test with a black-box booking contract. I ran it red: all
four business checks returned 404, proving the test described new behaviour.

The implementation in [`753f7d0`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit7-xty116/commit/753f7d0)
introduced Drizzle migrations, seeded rooms, atomic interval checks, JSON and
form routes, SSE change notices, and the timetable interface. I corrected the
result through the same production build CI runs: 29 tests covered search,
creation, overlap rejection, reload persistence, cancellation, structure, and
accessibility. I then drove a real booking in the browser at 1920×1080 and
390×844, refreshed to confirm persistence, checked zero horizontal overflow,
and tightened invalid-time and past-date handling found during that review.

The final check was the deployed Fly app, not the dev server. I also kept the
starter's `/readme/`, CSRF, migration, single-machine, and secret-handling
contracts intact so the implementation remains accountable after shipping.
