# Acceptance contract — adversarial verification map (Layer C, umbrella)

> Written before the build, so scope cannot drift to fit the delivery. Reviewer's mandate:
> **assume a hollow shell and try to prove it.** Only self-produced evidence counts — no "trust
> me", no "almost". A single REFUTED item drops the milestone until fixed. Each construction phase
> (C1/C2/C3) carries its own detailed acceptance; this umbrella guards the layer as a whole and its
> load-bearing boundary. Run tests with `node --test tests/*.test.ts` and the gate with
> `node src/index.ts check .`.

## The four pieces (verified as each phase lands)

| #   | Promise                                                                                           | How the adversary verifies (objective)                                     | Hollow-shell trap -> how it is caught                                                                                                                                                                                                                                     |
| --- | ------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| C-1 | Every generated project ships the mandatory experience checklist rule, real content               | Scaffold a web project; open `.claude/rules/experience-quality.md`         | A stub -> reviewer confirms every required question is present (hierarchy, phone, empty states, errors, contrast, touch, one pattern, spec-coherence)                                                                                                                     |
| C-2 | The neutral hand-off slot ships empty (bring-your-own), not decorated                             | Scaffold; inspect the visual-system slot and the four state components     | A filled slot -> reviewer confirms the structure is present but carries NO concrete palette/font/spacing/component identity                                                                                                                                               |
| C-3 | The deterministic checks block on real failures (a11y lint, contrast in a real browser, viewport) | Scaffold web; run `pnpm lint` and `pnpm test:e2e`; mutate an input to fail | A check that always passes -> reviewer confirms jsx-a11y errors on bad markup, axe fails on sub-AA contrast, and the viewport assertion fails when removed. Touch-target/four-states are NOT here (rebased to judgment, piece 3/1) — confirm they were not faked as gates |
| C-4 | The three reviewers ship with real mandates and recommend (do not block alone)                    | Open each agent file; confirm it is invoked in the workflow                | An empty agent stub -> reviewer confirms each has a real mandate and that none is wired as a hard hook                                                                                                                                                                    |

## Global checks

| #   | Promise                                                                | How the adversary verifies                                                                                                                                 |
| --- | ---------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| G1  | **Neutrality held (load-bearing).** No concrete visual identity leaked | Grep the Layer-C files for hardcoded hex colors, font-family names, spacing scales, or branded component names; the slot must be empty. One leak = REFUTED |
| G2  | Nothing broke: zero errors AND zero warnings                           | `npm run check` + `npm run build`; require 0/0 across the repo                                                                                             |
| G3  | No new faked hard hook                                                 | `.claude/hooks/` still holds only block-secret and block-protected-branch; the judgment reviews are rules/agents, not hooks                                |
| G4  | Honest scope + honest tiers                                            | No new CLI command; no art/branding/logo generation; each check is declared hard OR judgment, and the code matches the declaration                         |

## Verdict

Each row: **CONFIRMED** (with pasted evidence) or **REFUTED** (with what was missing). No row on
narration. One REFUTED = not delivered until corrected. G1 (neutrality) is the row that most tempts a
hollow pass — hold it hardest.
