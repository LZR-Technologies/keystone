# Layer C — Experience Quality — spec

> Umbrella spec for Keystone's third layer. Tracked by issue #8. Built rules-first, like Layers A
> and B: harness rules, reviewers, and a small set of deterministic checks that ship in every
> project. This spec is the source of truth; when it and the code diverge, the spec wins. The
> adversarial acceptance contract is in `acceptance.md`. Construction is phased (see "Delivery
> phases"); this umbrella defines the whole layer and its non-negotiable boundary.

## The request, restated

Keystone today ships two layers: **A — Product Foundation** (architecture, tests, security, CI, code
quality, deploy) and **B — Agent Harness** (context, specs, subagents, memory, guardrails, workflow).
Both stop at engineering. A project can pass every test and still ship an interface that breaks on a
phone, has no empty state, and returns errors no one understands — which is not professional. Layer C
closes that gap: it makes **experience quality** part of the professional delivery, the same way
tests and security already are.

The layer does **not** design. It does two things: it **forces the project to answer** the questions
that separate a usable interface from an amateur one, and it **audits** the answers — with a handful
of measurable checks that block, and reviewers that judge and recommend. Actual visual creation
(beauty, brand, art) is left to a separate design skill; Layer C prepares the ground and guards the
quality.

## The non-negotiable boundary (why this layer stays defensible)

Keystone is white-label for the world. Layer C therefore enforces **universal properties** of a
usable interface — never a specific taste. It checks that a visual system **exists** and is
**consistent across screens**; it never ships **which** colors, fonts, spacing, or components a
project must use. Embedding a concrete design system would leak the house's taste into a neutral
product — the same leak the tenancy defaults were pulled for. The visual-system slot the layer
leaves is **empty (bring-your-own)**, not filled.

## Done-target (verifiable) — the four pieces

1. **Reviewers (subagents).** Every generated project ships experience reviewers under
   `.claude/agents/`, in the same shape as the existing spec/code/security reviewers:
   `experience-reviewer.md`, `accessibility-reviewer.md`, `ui-consistency-reviewer.md`, each with a
   real mandate (not a stub). They judge and recommend; they do not block on their own.
2. **Deterministic checks (only the ones a script can genuinely decide).** Checks that block, wired
   into the project's gate and CI: structural accessibility at lint time (jsx-a11y — missing alt
   text, invalid ARIA, a label with no control, a click with no keyboard path), color contrast
   measured in a real browser (axe in the E2E suite, run by the project's CI), and a mobile viewport
   declaration (asserted in the rendered DOM). Skipped honestly where a project type has no interface
   (a service with no UI). **Rebased honestly from the first draft:** "the four states present" and
   "touch-target size in every case" are NOT reliably decidable by a static check — the first needs
   per-screen logic, the second computed layout — so faking them as hard gates would be the false
   confidence this product refuses. They stay in the checklist (piece 3) and the reviewers (piece 1).
3. **The mandatory checklist.** Every generated project ships a harness rule
   `.claude/rules/experience-quality.md` that makes the project answer, before it calls itself done:
   is there visual hierarchy? does it work on a phone? are there empty states? are errors
   understandable? does contrast pass? are touch targets adequate? do components follow one pattern?
   is the experience coherent with the spec?
4. **The neutral hand-off slot.** A structural, empty place for the project's visual system
   (bring-your-own) plus the four state components already shipped, so a separate design skill can
   plug in and create the look — Keystone leaves the ground ready, not decorated.

## Delivery phases (construction order, each its own issue + acceptance)

- **C1** — the mandatory checklist rule + the neutral hand-off slot (cheapest, highest value, pure
  enforcement).
- **C2** — the deterministic checks wired into the gate (measurable, blocking).
- **C3** — the three reviewers (judgment, recommending).

This umbrella spec is approved first; each phase then gets its own spec + adversarial acceptance,
built and sealed like the five enrichment phases.

## Out of scope (now, and by design)

- **Any concrete visual identity** — colors, fonts, spacing, radius tokens, or branded components.
  The slot is empty by design (see the boundary above). This is the load-bearing exclusion.
- Art generation, branding, logos, moodboards, deep art direction, complex animation, a catalog of
  visual styles, or any attempt to replace a designer or a professional design tool.
- Making the judgment reviews into hard hooks — whether hierarchy is good or the experience matches
  the spec is judgment; a hook there would be false confidence.
- Any new CLI command.

## Enforcement tiers (declared honestly)

- **Hard / deterministic** (blocks): the piece-2 measurable checks (contrast, touch target, the four
  states present, viewport, alt text) and the **shipping** of the reviewers, the checklist rule, and
  the hand-off slot — all proven by tests that read real content.
- **Judgment / reviewer** (recommends, does not block alone): visual hierarchy, coherence with the
  spec, "is the experience clear". These are subagents run in the open — not a 100% machine
  guarantee. Honest by the house's Rule Nº 1: never promise a hard gate where the truth is judgment.
