# Crit 7 reflection

The breakthrough was turning “replace an ANU system” into one observable promise:
someone can find a suitable room, book it without creating a clash, reload, and
still see it. That sentence removed a lot of tempting but hollow scope. Once I
wrote the HTTP contract before the implementation, the database and interface
had a shared target. The red test was useful evidence that the contract was not
merely describing the starter, and the later green run showed the whole built
server met it.

This changed the kind of developer I want to be from someone who measures
progress by visible features into someone who creates confidence. For this
prototype, that meant declining to fake SSO, approvals, or live room authority;
labelling the sample inventory honestly; and spending effort on the less visible
parts such as atomic overlap checks, migrations, persistence, and cancellation.
It also meant treating mobile review and the deployed environment as part of
development rather than a final presentation step.

I still want to build interfaces with personality, but I now want that polish to
clarify state and consequence. The timeline, conflict pattern, and persistent
booking list matter because each helps a user answer “did that work?” quickly.
That is a more demanding and more useful standard than simply making the page
look complete.
