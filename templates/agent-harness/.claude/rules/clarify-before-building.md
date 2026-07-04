# Clarify before building -- ask, don't guess

> A spec looks complete until you try to build it. Before writing code for a spec, run a
> clarification pass: surface what is ambiguous, contradictory, undefined, or untestable, and
> ASK -- rather than guess and build the wrong thing. Catching a gap before code is cheap; after
> code it is rework.
>
> (No `paths` scope on purpose: this governs how any spec is approached, not a file type, so it
> loads every session.)

## The rule

After a spec is drafted and before any code is written for it, check it against these five and
raise anything you find:

1. **Ambiguity** -- a requirement that could be read two ways. Name the readings and ask which one
   is meant.
2. **Conflict** -- the spec contradicts the constitution (`specs/constitution.md`), another spec,
   or existing behavior. The constitution wins; surface the clash and resolve it before building.
3. **Undefined rule** -- a business rule the spec assumes but never states (a limit, a default,
   what happens to existing data, who is allowed). Ask for the value; do not invent it.
4. **Edge case** -- the unhappy paths the spec is silent on: empty input, missing permission, two
   actions at once, the thing that fails. Each should have an intended behavior.
5. **Untestable requirement** -- a done-target you could not write a test for ("fast",
   "intuitive"). Push it until it is verifiable, or it is not a done-target.

Batch the questions and ask them together, before starting -- not one at a time mid-build. If
there is nothing to clarify, say so plainly and proceed: a clarification pass that finds nothing
is a valid outcome, a skipped one is not.

## What you may decide yourself

The pass is not licence to ask about everything. Mechanical, reversible, low-stakes choices (a
variable name, the order of two independent steps, an icon) are yours to make. Ask about what
changes the *substance* of the result -- the data written, the structure created, the rule
enforced, the behavior a user sees. When unsure which side a choice falls on, treat it as
substance and ask.

## Enforcement tier

A **rule** -- whether a clarification pass was thorough, or an ambiguity real, is a judgment no
script can make. Faking a hard check here would be the false confidence this harness refuses. The
pass is the agent's discipline, run in the open so the user sees the questions before code exists.
