# Project-Creation Setup Flow

> **What this document is:** the question script and behavior of the create-a-new-project command,
> **before and during** scaffolding. It collects only what is a matter of the user's taste, infers
> what can be inferred, and ships everything that is a platform decision already made. See
> [pillars.md](pillars.md).
>
> **Status:** the create-a-new-project command is one of three commands that are actually built
> today — alongside running the automatic checks and analyzing an existing project read-only.
> Those three are the whole of what is implemented (plus the Layer B agent harness, which `new` lays
> into every project); the broader family of capabilities this template aims for (automatic deploy,
> staging, rollback, review gate, task board) is still planned, not built. This document describes the
> setup flow the implemented create-a-new-project command runs.
>
> **What "create" actually does today (ground truth):** it copies the official template (web or api)
> into a new project folder, renames the package to the project's name, writes a `keystone.json`
> record of how the project was created, and computes two inferred choices (whether it needs a
> database, and the security level) from the answers. That is the whole of it. It does **not** create
> a git repository, commit, or push; it does **not** provision or connect a database, take or store
> any service key, or run migrations; it does **not** run a design step, install dependencies,
> activate the git hooks, or run any test / check / CI. Everything else described below as
> "the command does X" for versioning, database, and design is **planned, not built** — the questions
> for those rounds are part of the intended flow, but today their answers are only recorded, not
> acted on.

---

## Three kinds of decision (the golden rule)

1. **Platform decision** (fixed, already settled) → decided by the standard, NOT asked and NOT inferred.
   E.g. errors block shipping, a test ships with the feature, nothing truly disappears from the database.
2. **Inferred decision** (derived from what the user already said) → NOT asked.
   E.g. **does it need a database?** — inferred from project type + data sensitivity.
3. **Project decision** (a matter of the user's taste, only they know) → becomes a question.
   E.g. name, language, screen priority, visual identity.

> Principle: only ask type 3. The more the flow infers (type 2), the less it burdens the user.

---

## Round A — Product briefing (the minimal wizard)

The essential minimum. Six always-asked questions (the fifth branches into a deeper briefing), plus
a seventh that appears only for database-backed types.

### 1. Project name · _free text_

### 2. Project type · _pick one_

- Site / page (showcase, marketing)
- System with login and data (dashboard, authenticated area)
- Service that talks to other systems (an API — the "front door")
- Mobile app

### 3. Starting language · _pt · en · es · other_

### 4. Screen priority · _mobile · desktop · both_

### 5. Visual identity · _pick a path_

- **Generate a custom identity** (default) → triggers the **deep briefing** (below), whose answers are
  recorded for a later, still-planned identity-generation step that would derive an identity from the
  product's essence, avoiding a generic AI look
- **Import my own** → the user brings a ready identity (existing brand, design done elsewhere); a
  later, still-planned step would apply it
- **Decide later** → starts with the template's neutral default look (the only path that acts today,
  because the template already ships that look)

> Today, the visual-identity answer is only recorded in `keystone.json`. No design step runs — a new
> project starts with whatever look the copied template already contains.

### 6. Handles sensitive data or money? · _yes · no_ → feeds the security and database inference

### 7. Serves multiple separate clients? · _yes · no_ → only for database-backed types (system/service)

Asked, not assumed — the "ask, don't impose" principle. A template must not presume every project is
a multi-client SaaS, so the question decides the shape of the generated database:

- **Yes (multi-tenant)** → the example database ships with tenant isolation: a `tenant_id` on every
  table and a row-level-security policy keyed on it, plus the tenant-isolation test.
- **No (single-tenant)** → the example database is the simpler single-owner shape: the same table
  without `tenant_id`, without row-level security, and without the isolation test.

Skipped entirely for a plain site (no database), where the question would be noise. This is the one
piece the template acts on immediately at creation — the single-tenant variant is applied by the
create command, not merely recorded.

### 8 & 9. Super-admin? · Audit log? · _yes · no each_ → only inside the multi-tenant path

Two more asked-not-assumed questions, shown ONLY when question 7 = multi-tenant (a single-owner
project has no other clients to administer and rarely needs a cross-client tamper-proof log). Each is
independent — neither is bundled with the other or imposed by choosing multi-tenant:

- **Super-admin** → adds a role that can see and act across all clients (for support/administration):
  the row-level-security policy gains an "or is a super-admin" branch, signalled per connection. No →
  every session stays scoped to one client.
- **Audit log** → adds an append-only, tamper-proof record of who changed what, fed automatically by a
  trigger; updates and deletes on it are rejected. No → no audit log.

Both are applied by the create command (the corresponding migration and its test ship only when
chosen), not merely recorded.

---

## Deep briefing (conditional — only on the "generate a custom identity" path)

Fuel for a still-planned identity-generation step. Does NOT run if the user imports a design or
decides later. Questions (one at a time): real purpose · who uses it (skill level / frequency / state
of mind) · primary action · differentiator · desired feeling. Today these answers are only collected
and recorded; when the identity-generation step is built, they are what would drive palette,
typography, tone, and density derived from the product's essence.

---

## Round B — Technical setup (where the project lives)

Type-3 questions about infrastructure:

- **Where to version** · _pick one_ → GitHub · GitLab · local only (no cloud)
- **Visibility** · _public · private_
- **Parent folder** · _where, on the machine, the project folder will be created_

> The command **creates the project folder itself** inside the parent folder — this part is built: it
> copies the official template into a new folder named after the project. The user does not need to
> create any folder beforehand, nor run the command from inside one.
>
> The versioning and visibility answers, however, are **only recorded** today. The command does **not**
> create a git repository, make a commit, push to GitHub/GitLab, or set repo visibility — that is
> planned, not built. After creation, the developer initializes git and creates the remote repo
> themselves.

---

## What the flow INFERS on its own (type 2 — not asked)

- **Database need:** from project type + data sensitivity (detailed in the section below).
  - The question "will it have a database?" does NOT exist — it is inferred, not a user choice.
- **Security level:** essential by default; raised to reinforced if question 6 = sensitive.
  - Both of these are computed and written into `keystone.json` — that inference is built. What is
    inferred is a **record**, not an action: nothing is provisioned or configured from it yet.
- **Design-system application:** the visual foundation (fonts, spacing, accessibility, locale
  formatting) is fixed by the standard, and the template already ships it. There is no separate
  design step that "applies" it — a new project simply inherits the foundation the copied template
  already contains. The personality (color / font) that would follow the path chosen in question 5
  is planned, not built.

---

## Database — how the flow resolves it (mostly planned)

> **Built today:** only step 1 — the inference of whether a database is needed, recorded in
> `keystone.json`. Steps 2–6 describe the **intended** database flow and are **not built**: the
> command does not choose or provision a database service, does not ask for or store any access key,
> does not create or connect a database, and does not run migrations. What follows is the design for
> that flow, not a description of running behavior.

1. **Need (inferred, not asked) — BUILT:** from project type + data sensitivity, recorded in
   `keystone.json`.
   - Marketing site → no database (the topic never comes up).
   - System with login / data / sensitive → needs a database.
2. **Database service (planned):** the intent is a default choice, with the option for the user to
   swap it for another. Today the command makes no such choice.
3. **Service access (account + key) — planned, and the honest point:**
   - The command would **NOT create the account** on the service (sign-up / payment is the user's own).
   - **First time (planned):** it would ask for the access key **once** and store it securely in the
     user's environment, **outside the code**. Today it asks for and stores nothing.
   - **Next projects (planned):** it would reuse the stored key — no need to ask again.
4. **Database creation (planned):** with a key in hand, the command would **create the project's
   database and connect it** on its own. Today it does neither; a new project is created with no
   database attached, regardless of the inferred need.
5. **Structural changes (migrations) — planned:** the intent is to always go through the service's
   official tool — deterministically, without AI, at zero cost — so schema changes stay deterministic
   and free of any AI-service dependency, matching the rest of the deterministic foundation. Today the
   command runs no migrations.
6. **AI-to-database bridge (an AI↔database shortcut):** the command does **NOT touch** it — and this
   is true today because the command touches nothing about the database at all. Anyone who wants the
   convenience of querying the database through AI turns it on themselves.

---

## Visual-identity paths (summary)

> Today all three paths only **record** the choice; the identity work described in the middle column is
> planned. The one thing that actually happens is that a new project inherits the template's default look.

| Path                                 | What is intended to happen (planned unless noted)                       | Deep briefing? |
| ------------------------------------ | ----------------------------------------------------------------------- | -------------- |
| Generate a custom identity (default) | Would derive identity from the essence; avoids a generic AI look        | Yes            |
| Import my own                        | User brings a ready brand / design; a later step would apply it         | No             |
| Decide later                         | Neutral default look from the template (acts today); personalized later | No             |

---

## Presentation (works the same across environments)

- Inside an AI assistant with cards → questions become multiple-choice cards.
- In another environment → questions as plain text.
- Same content, two skins. AI cost only in the AI environment, and only at creation time.
