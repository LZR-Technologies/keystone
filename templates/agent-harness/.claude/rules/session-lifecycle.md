# Session lifecycle -- resume, work, close, hand off

> An agent session has no memory of the previous one. This rule turns that limitation
> into a routine: every session starts by picking up a hand-off and ends by writing one.
> The permanent record lives in the daily log and in long-term memory; the briefing is
> the disposable hand-off note passed between sessions.
>
> (No `paths` scope on purpose: this rule governs the session itself, not any file type,
> so it must load every session.)

## Trigger commands

The lifecycle runs on explicit words, so a new user needs to know them up front:

- **"resume session"** (or **"continue"**) -- starts a session and runs the resume
  sequence below. Opening a chat without saying it is just an open window, not a session.
- **"close session"** (or **"wrap up"**) -- ends the session and runs the close sequence.

**Safeguard on the resume trigger.** "continue" (and "continuar") is an everyday word --
"continue with that approach", "continue the loop", "let's continue" mid-task all use it
without meaning "run the resume sequence". So treat it as the resume trigger only when it
arrives as a **short, standalone message** (the word on its own, or a bare phrase like
"resume session" / "continue session" -- roughly a handful of words, nothing else asked).
The moment "continue" sits inside a larger instruction, it is an ordinary word in that
sentence, not the trigger -- do not kick off the resume sequence. When genuinely unsure,
ask one short question rather than silently re-running a resume mid-session.

## On resume -- in this order

1. **Identify the coder.** Read the user name from version control
   (`git config user.name`). Normalize it: lowercase, then replace every run of spaces
   with a single hyphen (`"Ana Maria"` -> `ana-maria`). That name keys the briefing
   folder and the daily log. Never ask the user who they are -- the config already
   knows, and deriving the name from version control keeps the same person the same
   coder on every machine (a manual answer per machine would fork one person's history
   in two). If `git config user.name` returns empty (a freshly set up machine), fall
   back to the coder name `unknown-coder` and say so honestly in the resume summary --
   do not stop and ask, and do not silently guess a name.
2. **Read long-term memory before anything else.** Open `memory/MEMORY.md` (the index)
   in full -- it is short by design. For each line whose hook looks relevant to today's
   likely work, open that memory file too. Skipping this step is the one that makes
   memory write-only: decisions get saved at close but never re-loaded, so the same
   ground gets re-decided every session.
3. **Locate and read the newest briefing** under
   `knowledge/project-journal/briefings/<coder>/` (newest by the date in the filename).
   Read it in full, not skimmed. **Check its age first:** if the date in the filename is
   more than 7 days old, flag it in the resume summary as possibly stale before treating
   its contents as current truth -- a week-old briefing may describe branches already
   merged, decisions already reversed, or work someone else has since moved on. Still read
   it (it is the best hand-off available), but confirm the open items against the codebase
   survey in step 4 rather than acting on the briefing's word alone, and note the staleness
   to the user so they can correct anything that has drifted.
4. **Survey the codebase beyond the briefing -- mandatory, before any action or summary.**
   The briefing describes intent; the repository holds the truth. At minimum:
   - version-control status and recent history: current branch (`git branch
     --show-current`), uncommitted changes, the last ~20 commits, open branches
   - the project `README` and the root agent-context file
   - the project structure: top-level folders, and where the code the briefing talks
     about actually lives
   - every file the briefing mentions explicitly -- open and read it; never act on the
     briefing's summary of a file instead of the file
   Skipping this to "save reading" is false economy: one action taken on a stale
   assumption costs more than the whole survey.
5. **Open today's entry in the daily log**
   `knowledge/project-journal/daily-log/<coder>.md`. Count today's existing sessions in
   the log -- the new one is N+1 (numbering restarts each day) -- and append the header
   with the START time stamped now. Get the actual wall-clock time by running a
   date/time command (for example `date` on macOS/Linux, or `Get-Date` on Windows
   PowerShell) -- never leave the field blank and never invent a time:

   ```markdown
   ## YYYY-MM-DD -- Session N
   - Coder: <coder>
   - Start: HH:MM
   - End: (in progress)
   - Duration: (in progress)
   - Working branch: <branch>

   ### Summary
   (filled at close)
   ```

   The open header lives directly in the log until close -- no separate scratch file,
   which would just be a second place for the same state to go stale.
6. **Present a short summary** (3-5 lines: what was open, the briefing's "first question
   to ask", the likely paths) and wait for the user's answer before any destructive
   action.
7. **Delete the absorbed briefing -- only after the summary is presented.** Briefings are
   disposable by design: once absorbed, the useful part is in your working context and the
   permanent part already lives in the daily log and long-term memory. A pile of stale
   briefings is noise that a future session will one day mistake for current truth. The
   order matters: deleting before the summary throws away the source while you are still
   drawing on it -- if anything interrupts the run between the two steps, the briefing is
   gone and un-summarized. Summarize from it first, then delete.

### Edge cases

- **No briefing, or a new coder:** say so honestly, create the coder's briefing folder
  and daily-log file, and still run the survey (step 4) before asking the user for
  context -- never ask what version control can answer.
- **A previous session left open from an earlier day** (an entry still reading
  `End: (in progress)` dated before today): ask whether to close it with the elapsed
  time or discard it. Never silently overwrite it.
- **A session left open from earlier TODAY** (the common crash-or-restart case: the
  daily log already has a `Session N` for today reading `End: (in progress)`). Close
  that entry first, using the same close sequence below, before opening a new one --
  guess the end time as "now" and label the duration estimated, noting in its Summary
  that the session was recovered after an interruption rather than closed normally.
  Then open the new entry as `Session N+1`. Never leave two entries open at once, and
  never renumber or delete the interrupted entry -- it is still true that work happened
  in it.

## On close -- in this order

1. **Write the hand-off briefing** at
   `knowledge/project-journal/briefings/<coder>/briefing-YYYY-MM-DD-<short-slug>.md`
   using the embedded template below. `<short-slug>` is 2-4 words naming the session's
   work (e.g. `auth-flow-fix`). Fill it from the whole session yourself -- do not ask the
   user what to put in it.
2. **Close the daily-log entry:** stamp the END time (run the same date/time command
   used at resume -- never leave it blank or invented), compute the TOTAL duration, and
   fill the Summary with what was done and what is open -- detailed enough to
   reconstruct the session six months later.
3. **Save durable decisions to long-term memory** (see
   `.claude/rules/long-term-memory.md`). The boundary: the briefing carries in-flight
   state (an open PR, a pending validation, the next step); memory carries permanent
   facts (rules, decisions, invariants). Anything that should still be true next month
   goes to memory -- a permanent fact parked only in a briefing dies when the briefing is
   absorbed and deleted.
4. **Commit AND push the daily log, the new briefing, and any memory changes** on the
   current working branch. `git add` the three paths, commit, then push the working
   branch to the remote. This rule does not require a dedicated branch or PR for
   journal-only changes -- the commit rides on whatever working branch is checked out --
   but it does require the push.
   - **Commit message format:** the project's commit hook (commitlint) rejects a bare
     message, so use the conventional `type(scope): subject` shape. For a session-close
     journal commit that is `chore(journal): close session N` (substitute the real
     session number). A "short message is enough" in spirit, but it must still carry the
     type and scope or the commit is rejected at the hook.
   - **Why push, not just commit:** a commit that never leaves the machine is exactly as
     invisible to the next machine as an unsaved file. The cross-machine coder-identity
     design in step 1 of the resume sequence only works if this record actually reaches
     the remote -- a local-only commit strands the daily log and briefing on one machine,
     so the same coder resuming elsewhere (and any other coder on the project) sees
     nothing. Commit writes it down; push is what makes it travel.

## Context budget -- wind down at roughly 60%

When roughly 60% of the context window is consumed, stop taking on new work: finish the
current step, then run the close sequence and hand off. The reasoning quality of an agent
degrades as its window fills, so a clean hand-off to a fresh session beats a long
degraded one. The 60% mark is deliberate: the close sequence itself reads and writes
several files, and it must run while there is still headroom to do it well.

**This is an approximate self-check, not a hard meter.** No tool in this harness reports
an exact percentage, so use whichever of these is available, in order of preference:

1. **The environment's own context indicator**, if the coding assistant surfaces one
   (several show a running token count or a remaining-context percentage in the UI or
   in a status line). Treat that number as ground truth when present.
2. **If no indicator is available, use proxies** and treat crossing two or more of them
   together as the wind-down signal, since any single one alone is a weak proxy:
   - a long working stretch with no natural stopping point (rough guide: more than
     about 40-50 substantial tool calls in the session so far)
   - the transcript has grown long enough that early parts of this same session are
     already hazy or hard to recall without re-reading them
   - responses have started feeling noticeably slower to produce, or the agent notices
     itself re-reading the same file more than once because it lost track of what it
     already knew

When in doubt, wind down earlier rather than later -- a hand-off one step early costs a
little redundancy in the next session's survey; a hand-off one step late risks a
degraded close sequence, which is the one sequence that most needs a clear head.

**A harder mechanic is possible as a future improvement, not claimed here.** A rough token
estimate from the transcript size (characters or words seen so far, against a known
context-window budget) could turn "roughly 60%" into a concrete number even when the
environment exposes no indicator. That would be a real proxy, not a fake meter -- but it is
not wired up today, and it is deliberately not a hook: nothing forces the wind-down, since
whether reasoning has actually degraded is a judgment the agent still makes. Noted so a
later version can add the estimate honestly rather than pretending this self-check is
already precise.

## During the session

Do not write to the daily log for every small step -- the open header stays untouched
until close. Long-term memories are the one exception: save those the moment the durable
decision happens (see the memory rule), not at close.

## Briefing template (embedded)

```markdown
# Briefing -- <session title>

> Origin: session N of YYYY-MM-DD, coder <coder>.
> How to use: read at the start of the next session, then delete -- briefings are
> disposable; the permanent record lives in the daily log and long-term memory.
> Status at close: <one line -- what is open or waiting right now>

## Session summary
<What was done: commits, branches, PRs, decisions taken -- concise narrative.>

## Open branches / PRs
<Each with name or URL, current state, and what blocks it.>

## State of external systems / data
<Changes made outside the repository during the session: database, third-party
services, deployed environments. Empty is fine -- say "none".>

## What remains
- Immediate: <what is waiting right now, with any validation checklist>
- Medium term: <next work items, by priority>

## Where to resume
<The first question to ask the user, and the 2-3 likely paths depending on the answer.>

## Decisions captured
<Numbered. Mark explicitly which ones were saved to long-term memory.>
```
