# Subagent-driven development -- one fresh agent per task, reviewed twice

> For work big enough to have a task list, doing every task in one long-running context lets earlier
> work blur later judgment and fills the window. Instead, dispatch each task to a fresh subagent with
> clean context, and put its result through two reviews before it counts as done. The main thread
> stays a clean coordinator, not a cluttered worker.
>
> (No `paths` scope on purpose: this governs how substantial work is executed, not a file type, so it
> loads every session.)

## When to use it

From work level 3 up (`work-level-routing.md`, the `subagents` capability): a product feature, a new
product, a critical system -- work with a real task list (`plan-and-tasks.md`). Below that -- a quick
fix, a small feature -- the overhead is not worth it; do the work directly. The loop is a tool for
scale, not a ceremony for every change.

## The loop, per task

1. **Dispatch a fresh implementer.** Give one task from the list to a subagent with clean context:
   the task, the slice of the spec it serves, and the constitution. It does that one task, nothing
   more.
2. **Review in two stages** -- both must pass before the task counts as done:
   - **Spec compliance** (`.claude/agents/spec-reviewer.md`): does the result meet the part of the
     done-target this task claims? Not "is it nice code" -- "is it the right thing".
   - **Code quality** (`.claude/agents/code-reviewer.md`): the diff against the review rubric
     (design, edge cases, tests, security, performance, restraint).
   - For a security-sensitive task, add the **security auditor**
     (`.claude/agents/security-auditor.md`).
   - For a UI task, add the **experience reviewers** (`.claude/agents/experience-reviewer.md`,
     `accessibility-reviewer.md`, `ui-consistency-reviewer.md`): they judge what the hard experience
     gates (contrast, structural a11y, viewport) cannot — visual hierarchy, the four states,
     keyboard/screen-reader access, and visual consistency. They recommend; they do not block alone.
3. **A critical issue blocks.** If a reviewer raises a critical issue, the task is not done -- it
   goes back to a fresh implementer with the finding, not waved through. The review is enforced by
   sending the work back, not by the main thread's goodwill.
4. **Then the next task.** One task fully through the loop before the next begins, so a broken task
   never hides behind a pile of half-finished ones.

## Why fresh context each task

A subagent that only ever saw one task cannot be biased by ten earlier ones, and its narrow context
leaves room to actually reason about that task. The main thread holds the plan and the state, not the
line-by-line work -- so it stays able to judge the whole.

## Enforcement tier

A **rule** -- the reviewers themselves are real (they run in isolated context and return a verdict),
but whether the loop was followed, and whether a "critical issue" truly blocks, is the agent's
discipline. No hook can dispatch a subagent or judge a review; a script pretending to would be the
false confidence this harness refuses. The consequence of a failed review is enforced by sending the
task back, in the open, where it can be seen.
