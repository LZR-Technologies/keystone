# Tests Pillar — full rule

> The Tests pillar rule in full. Outline in [pillars.md](pillars.md).
> Essential level. 🔧 = backed by an automatic check that runs today.
>
> **Status:** only three commands are built — `new` (scaffold a project), `check`, and `analyze`.
> `check` runs three text guards over files (exposed secrets, oversized files, dangerous patterns)
> plus the project's own gates, including running its `test` script and blocking on failure.
> `analyze` is read-only and runs six presence checks — exposed secrets,
> `.gitignore` completeness, presence of tests, presence of a README, basic database-convention text
> checks, and oversized files. **`check` runs the project's own `test` script as a blocking gate**
> (a failing suite fails `check`); `analyze`, separately, only checks whether test files _exist_.
> What is **not** built is the automatic **publish-time** gate — re-running the suite before a project
> ships. Everything below about that automatic pre-publish re-run is the **target** this pillar aims
> for, not a delivered pipeline.

## Principle

The safety net that makes everything else enforceable: without tests, Code quality's "always blocks"
and Ship it's "ships itself" would have nothing to stand on. It is an adversarial verifier that runs
at zero cost.

## 1. A test ships with the feature

- Every new feature **comes with its test**, from day one. The net grows with the project.
- No "test it later" (which turns into "later, never").

## 2. Cover the happy path AND the unhappy paths

- Test normal use **and** the bad situations: invalid input, abuse, no permission, boundary cases.
- This is where robustness and security live (it connects to "never trust incoming input").

## 3. If it fails, it doesn't ship

- A failing test should **block shipping**, automatically — the net is enforced, not advisory.
- 🔧 The `check` command runs the project's own `test` script as a blocking gate: a failing suite
  makes `check` fail. (`analyze` still only reports whether test files exist — a separate, read-only
  presence check.)
- **Planned:** re-running that gate automatically before publishing (a publish-time gate) is the
  target, not built yet.

## 4. Focus on what matters, not on a number

- Cover the **critical paths** well (money, login, customer data) without chasing a coverage percentage.
- Quality over quantity — no useless tests written just to hit a target.

## 5. Reliable tests

- Tests are **stable** (no random failures) and **independent** (order does not matter).
- A flaky test is treated as a bug, not ignored.

## References

Established testing guides. The **planned** automatic suite runner would grow the net with every
change. Today `check` runs the project's `test` script as a blocking gate; `analyze`'s presence
check, separately, only reports whether the project has any test files.
