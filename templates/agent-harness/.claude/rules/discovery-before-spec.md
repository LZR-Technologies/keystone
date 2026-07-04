# Discovery before the spec -- understand the problem before the solution

> A technical spec answers "how do we build it". Discovery answers what comes first: what problem,
> for whom, worth what, measured how. Skipping it builds something technically clean and commercially
> useless. For substantial work, do discovery before the feature spec -- and scale its depth to the
> size of what you are building.
>
> (No `paths` scope on purpose: this governs how substantial work begins, not a file type, so it
> loads every session.)

## When, and how deep -- by level

From work level 3 up (`work-level-routing.md`, the `discovery` capability). The depth scales:

| Level | Discovery depth |
| --- | --- |
| 3 -- Product feature | The problem, the user, the goal, and how success is measured. Enough to know it is worth building. |
| 4 -- New product | The above, plus personas, the value proposition, the main user journeys, success metrics, and who the competitors are. |
| 5 -- Critical / regulated | The above, plus risks, compliance obligations, the stakeholders, what gets audited, and which data is sensitive. |

Below level 3 -- a quick fix, a small feature -- skip it; the problem is already understood.

## The business questions discovery must answer

Who pays, who uses, what problem it solves, how success is measured, what the financial risk is, what
the revenue model is, what it costs to run, what external dependency it leans on, and which assumption
most needs to be validated. Not every project answers all of them -- but a project that answers none
is being built blind.

## The UX artifacts discovery must produce (verifiable)

Discovery is not just prose; it leaves artifacts a reviewer can check, and they feed the feature
spec's done-target and the tests that follow:

- the main user journey (the happy path, end to end);
- the empty, loading, error, and success states of each screen;
- what a user without permission sees;
- the mobile view;
- accessibility notes;
- the actual interface texts -- not "TODO copy".

## The template

`discovery/discovery.md` ships with these sections. Fill the ones your level calls for; delete the
rest. An unfilled discovery on a level-4 build is a smell -- it means no one decided what problem is
being solved.

## Enforcement tier

A **rule** -- whether discovery was honest, or the journey real, is judgment no script can make. The
artifacts it produces are concrete and reviewable, but the decision to do it, and its quality, are the
agent's discipline, in the open.
