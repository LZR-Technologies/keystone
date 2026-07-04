# Plan, then small tasks -- from an approved spec to traceable work

> An approved spec says what "done" looks like; it does not say how to get there without a plan,
> nor how to keep the work traceable without breaking it into small pieces. After a spec is
> approved and clarified, turn it into a plan, then the plan into small tasks -- each one traceable
> back to a line of the done-target.
>
> (No `paths` scope on purpose: this governs how any spec is executed, not a file type, so it loads
> every session.)

## The rule

1. **Plan first.** Before touching code, write the approach in a few lines: the pieces to build,
   their order, and the risky part to prove first. The plan derives from the spec -- if it needs
   something the spec never decided, that is a clarification (see `clarify-before-building.md`),
   not an invention.
2. **Break the plan into small tasks.** Each task is one coherent, reviewable step -- something you
   could land in a single focused commit. If a task cannot be described in a sentence, it is two
   tasks.
3. **Trace each task to the done-target.** Every task points at the part of the spec's done-target
   it satisfies. When the tasks are done, the done-target is met -- no task without a target, no
   target line without a task.
4. **Keep the list live.** Mark tasks as they complete; if the work reveals a missing task, add it
   and say why. The list is the honest state of the work, not a plan written once and abandoned.

## The shape

A simple, ordered list is enough -- kept in the spec or beside it. Each line says what the task
does and which done-target line it serves:

    [ ] Add the submit endpoint       -> done-target: "a user can submit Y"
    [ ] Validate the Y input          -> done-target: "invalid Y is rejected with a clear message"
    [ ] Test the reject path          -> done-target: same line (the unhappy path)

## Enforcement tier

A **rule** -- whether a plan is sound, or a task truly small, is judgment no script can certify.
The discipline is the agent's, kept visible so the plan and its tasks can be reviewed before and
during the work.
