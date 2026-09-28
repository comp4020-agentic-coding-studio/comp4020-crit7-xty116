# Roomline: an ANU room-finding prototype

Roomline replaces one narrow part of university room booking: turning a group's
needs into an available place without making the organiser cross-reference a
room directory, a timetable, and a separate booking form. A user chooses a
date, start time, duration, group size, and facilities; compares suitable
spaces; makes a booking; and can confirm or cancel it after a reload. The room
catalogue is representative prototype data, not a connection to ANU's live
inventory or identity systems.

## What good looks like here

The useful outcome is certainty. Search results need to explain why a room fits,
not merely return a name, and the system must refuse overlapping reservations
even if two people act at nearly the same time. A successful booking must remain
visible after refresh and must be reversible. The interface should remain
legible on a phone while still making several rooms easy to compare on a large
screen.

I modelled the smallest credible end-to-end slice: representative spaces,
availability, booking creation, conflict handling, persistence, and
cancellation. I deliberately did not imitate ANU authentication, approvals,
recurring reservations, or claim real-time campus accuracy. Those features
would add false authority before the core interaction is proven.

`CLAUDE.md` turns these decisions into working rules. The supplied invariants
protect page structure and an accessibility floor, while
`spec/room-booking.test.ts` drives the built server over HTTP to protect search,
conflict rejection, persistence, and cancellation. Visual hierarchy, clarity
of facility labels, and the usefulness of the room comparison remain judgement
calls checked at the desktop and mobile marking viewports.
