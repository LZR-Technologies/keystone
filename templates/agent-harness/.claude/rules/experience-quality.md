# Experience quality -- a usable interface is part of "done"

> Passing tests and security is not enough. An interface that breaks on a phone, has no empty state,
> or returns errors no one understands is not professional. Before a screen is done, it answers the
> questions below. This does not make it beautiful -- that is a design skill's job. It makes it
> usable, consistent, and accessible: the floor of a professional delivery.
>
> (No `paths` scope on purpose: this governs when a screen is done, not a file type. It applies to any
> project with a user interface; a service with no screen skips it honestly -- there is nothing to
> answer for.)

## The questions every screen must answer before it is done

- **Visual hierarchy** -- is the most important thing the most prominent? Can the eye find the primary
  action without hunting?
- **Phone** -- does it work on a small screen: no horizontal scroll, nothing cut off, tap targets
  reachable?
- **The four states** -- loading, error, empty, and success are each handled, not just the happy
  path. An empty list, a failed request, and a slow load all show something intentional.
- **Errors** -- is the message understandable to a person? No raw stack trace, no internal code
  leaking to the user.
- **Contrast** -- does text meet the AA readability ratio against its background?
- **Touch targets** -- is every interactive element big enough to tap (44px minimum)?
- **One pattern** -- do components repeat the same pattern across screens, not a different button and
  spacing on every page?
- **Coherence with the spec** -- does the experience match what discovery and the spec described --
  the journey, the states, the interface texts -- not a shape improvised at build time?

A screen that answers none of these is not done; it is a draft.

## What this rule is NOT

It is not about beauty, brand, art, or a particular taste. The project's concrete visual system --
its colors, fonts, spacing, components -- is the project's own (bring your own; see the visual-system
slot in the web template). This rule checks that the experience is **usable**, never **which** look it
wears. Enforcing a specific identity would betray Keystone's neutrality.

## Enforcement tier (declared honestly)

- **The measurable questions become hard checks** in the project's gate (Layer C, phase C2): contrast
  ratio, touch-target size, the four states present, a mobile viewport, and image alternative text --
  each calculable, each blocking.
- **The judgment questions are this rule** -- visual hierarchy, coherence with the spec, "is it
  clear" -- discipline run in the open, backed by the experience reviewers (phase C3). No script can
  rule on taste, so this is never sold as a 100% machine guarantee. Honest by Rule Nº 1.
