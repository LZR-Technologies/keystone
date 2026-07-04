# Acceptance contract -- adversarial verification map (Phase 5)

> Written before the build, so scope cannot drift to fit the delivery. Reviewer's mandate:
> **assume a hollow shell and try to prove it.** Only self-produced evidence counts -- no "trust
> me", no "almost". A single REFUTED item drops the milestone until fixed. Run tests with
> `node --test tests/*.test.ts` and the gate with `node src/index.ts check .`.

## The rule and the template

| #   | Promise                                                                                   | How the adversary verifies (objective)               | Hollow-shell trap -> how it is caught                                                                                                                               |
| --- | ----------------------------------------------------------------------------------------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D1  | Every generated project ships `.claude/rules/discovery-before-spec.md` with real guidance | Scaffold a service AND a site; open the rule in each | A stub -> reviewer confirms the depth-by-level matrix (level 3/4/5), the business questions, and the verifiable UX artifacts are all present                        |
| D2  | Every generated project ships `discovery/discovery.md` with real sections                 | Scaffold both; open the template                     | An empty stub -> reviewer confirms real sections (problem, users, value, success metrics, business model, UX journey/states) with guidance, marked to fill by level |
| D3  | Depth scales by level, skipped below level 3, wired into the workflow                     | Read the rule and `docs/agent-harness.md` B2         | The rule applies discovery to a quick fix, or B2 does not place discovery before the feature spec -> reviewer confirms level-3-up scoping and the B2 reference      |
| D4  | A test proves both files ship, non-placeholder, both templates                            | Run the harness test; read it, then mutate           | A presence-only or `assert.ok(true)` test -> reviewer confirms it asserts real content for BOTH service and site, failing when the rule is gutted                   |

## Global checks

| #   | Promise                                      | How the adversary verifies                                                                                         |
| --- | -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| G1  | Nothing broke: zero errors AND zero warnings | `npm run check` + `npm run build`; require 0/0 across the repo                                                     |
| G2  | No new faked hard hook                       | `.claude/hooks/` still holds only block-secret and block-protected-branch; `settings.json` wires no discovery hook |
| G3  | Honest scope                                 | No new CLI command; no separate file-per-section pile. Check `src/` and the spec's out-of-scope                    |

## Verdict

Each row: **CONFIRMED** (with pasted evidence) or **REFUTED** (with what was missing). No row on
narration. One REFUTED = not delivered until corrected.
