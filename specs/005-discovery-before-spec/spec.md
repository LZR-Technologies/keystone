# Discovery before the spec -- spec

> Phase 5 of enriching Keystone -- the last of the agreed plan. Tracked by issue #5. Built
> rules-first: a harness rule plus an adaptive template that ship in every project. This spec is the
> source of truth; when it and the code diverge, the spec wins. The adversarial acceptance contract
> is in `acceptance.md`.

## The request, restated

Keystone's workflow today starts close to engineering: a feature opens with a technical spec. But a
spec answers "how do we build it", not the questions that come first -- what problem, for whom, worth
what, measured how. Skipping those builds something technically clean and commercially useless. This
phase adds the pre-spec discovery layer: for substantial work, understand the problem, the user, the
value, and success before the technical spec -- with depth that scales to the work level, so a small
feature is not buried in market analysis and a new product is not built blind. It ties to the
work-level router (the `discovery` capability, level 3+) and sits before the feature spec (B2).

## Done-target (verifiable)

1. Every generated project ships a harness rule `.claude/rules/discovery-before-spec.md` with real
   guidance (not a stub): when discovery applies (level 3 up), the depth-by-level matrix (level 3:
   problem/user/goal/success; level 4: + personas/value/journeys/metrics/competitors; level 5: +
   risks/compliance/stakeholders/audit/sensitive-data), the business questions it must answer, and
   the verifiable UX artifacts it must produce.
2. Every generated project ships a `discovery/discovery.md` template with the real sections (problem,
   users, value, success metrics, business model, UX journey and states, and the regulated extras),
   marked to fill what the level needs and delete the rest -- not an empty stub.
3. The rule declares the depth scales by level and is skipped below level 3, consistent with
   `work-level-routing.md`, and the harness map (`docs/agent-harness.md`, part B2) references
   discovery as preceding the feature spec for substantial work.
4. A test proves both the rule and the template ship in every generated project (both templates) with
   real content, not placeholders. `keystone check .` green.

## Out of scope (now)

- Making discovery a hard hook -- whether discovery was honest is judgment; a hook there would be
  false confidence.
- A separate file per section (vision.md, personas.md, ...) -- one adaptive template, to avoid
  shipping a pile of empty files a small project never fills.
- Any new CLI command.

## Enforcement tiers (declared honestly)

- The rule and template **shipping** are deterministic mechanics -- a test proves the files and their
  real content exist.
- **Doing discovery, and its honesty** (is the problem real? the journey true?) is a **rule** the
  agent runs in the open -- judgment, not a machine check. The artifacts it leaves (the journey, the
  states, the interface texts) are concrete and reviewable, which is what makes the discipline
  checkable at all.
