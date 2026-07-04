# Acceptance contract -- adversarial verification map (Phase 2)

> Written before the build, so scope cannot drift to fit the delivery. Reviewer's mandate:
> **assume a hollow shell and try to prove it.** Only self-produced evidence counts — no "trust
> me", no "almost". A single REFUTED item drops the milestone until fixed. Run tests with
> `node --test tests/*.test.ts` and the gate with `node src/index.ts check .`.

## Milestone 1 -- Constitution

| #    | Promise                                                                 | How the adversary verifies (objective)                                                                 | Hollow-shell trap -> how it is caught                                                                                                                                                                                                |
| ---- | ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| M1.1 | Every generated project ships `specs/constitution.md` with real content | Scaffold a service AND a site; open `specs/constitution.md` in each; count the non-negotiable sections | An empty stub or a one-line placeholder -> reviewer confirms the real sections (architecture, security, data, testing/definition-of-done, accessibility, performance) are present with actual guidance, not headers over blank space |
| M1.2 | The workflow names the constitution the top authority                   | Read `docs/agent-harness.md` (part B2) in a generated project                                          | The constitution is mentioned but not as the authority, or the "constitution wins on conflict" line is missing -> reviewer confirms B2 states the constitution outranks an individual spec and points to `specs/constitution.md`     |
| M1.3 | A test proves it ships in both templates, non-placeholder               | Run the harness test; read it                                                                          | A test that only checks the file exists but not its content, or `assert.ok(true)` -> reviewer confirms it asserts real section content for BOTH service and site                                                                     |

## Milestone 2 -- Mandatory clarification

| #    | Promise                                                                                            | How the adversary verifies (objective)                                        | Hollow-shell trap -> how it is caught                                                                                                              |
| ---- | -------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| M2.1 | Every generated project ships `.claude/rules/clarify-before-building.md` with its five real checks | Scaffold a service AND a site; open the rule in each; confirm the five checks | A stub or missing checks -> reviewer confirms Ambiguity, Conflict, Undefined rule, Edge case, Untestable requirement are all present with guidance |
| M2.2 | The spec workflow references the clarification pass before code                                    | Read `docs/agent-harness.md` (part B2)                                        | B2 does not place clarifying before approval/code -> reviewer confirms it points to the clarify rule and puts it before any code is written        |
| M2.3 | A test proves the rule ships, non-placeholder, both templates                                      | Run the harness test; read it                                                 | A presence-only or `assert.ok(true)` test -> reviewer confirms it asserts the five checks for BOTH service and site                                |

## Milestone 3 -- Plan -> tasks

| #    | Promise                                                                            | How the adversary verifies (objective)               | Hollow-shell trap -> how it is caught                                                                                          |
| ---- | ---------------------------------------------------------------------------------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| M3.1 | Every generated project ships `.claude/rules/plan-and-tasks.md` with real guidance | Scaffold a service AND a site; open the rule in each | A stub -> reviewer confirms plan-first, breaking into small tasks, and tracing each task to a done-target line are all present |
| M3.2 | The spec workflow references plan->tasks after approval                            | Read `docs/agent-harness.md` (part B2)               | B2 does not mention plan->tasks after approval -> reviewer confirms it points to the plan-and-tasks rule                       |
| M3.3 | A test proves the rule ships, non-placeholder, both templates                      | Run the harness test; read it                        | A presence-only or `assert.ok(true)` test -> reviewer confirms it asserts real guidance for BOTH service and site              |

## Milestone 4 -- Verify against the done-target

| #    | Promise                                                                                          | How the adversary verifies (objective)               | Hollow-shell trap -> how it is caught                                                                                       |
| ---- | ------------------------------------------------------------------------------------------------ | ---------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| M4.1 | Every generated project ships `.claude/rules/verify-against-done-target.md` with real discipline | Scaffold a service AND a site; open the rule in each | A stub -> reviewer confirms walking the done-target point by point, running the gates, and naming every gap are all present |
| M4.2 | The spec workflow references the verify step on completion                                       | Read `docs/agent-harness.md` (part B2)               | B2's completion bullet does not point to the verify rule -> reviewer confirms it does                                       |
| M4.3 | A test proves the rule ships, non-placeholder, both templates                                    | Run the harness test; read it                        | A presence-only or `assert.ok(true)` test -> reviewer confirms it asserts real content for BOTH service and site            |

## Global checks

| #   | Promise                                      | How the adversary verifies                                                                                                                                                                                                                                                                 |
| --- | -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| G1  | Nothing broke: zero errors AND zero warnings | `npm run check` + `npm run build`; require 0/0 across the repo                                                                                                                                                                                                                             |
| G2  | Honest scope                                 | Phase 2 is complete: M1 (constitution), M2 (clarify), M3 (plan->tasks), M4 (verify) all delivered. Nothing beyond Phase 2 (no CLI command, no convergence, no multi-agent adapter) is claimed. Check `git log` and the working tree. If a later milestone is claimed but absent -> REFUTED |
| G3  | Honest tiers                                 | The spec/docs do NOT claim a hard machine-check that a spec "conforms" to the constitution (that is a rule). If a faked hard check is claimed -> REFUTED                                                                                                                                   |

## Verdict

Each row: **CONFIRMED** (with pasted evidence) or **REFUTED** (with what was missing). No row on
narration. One REFUTED = milestone not delivered until corrected.
