// The wizard: it conducts the briefing, one question at a time, through a Prompter.
// Plain-text mode runs in any terminal with zero AI cost — faithful to the DNA.
// The content of the questions is the same whether asked as text or as cards.
// See docs/setup-wizard.md.

import type { Prompter } from './prompter.ts'
import { assertValidProjectName, normalizeProjectName, TEMPLATE_EXISTS_FOR } from './create.ts'
import type { KeystoneAnswers, ProjectType, ScreenPriority, VersionTarget } from './types.ts'

/** Run the full briefing (round A + round B) and return the collected answers. */
export async function runWizard(prompter: Prompter, presetName?: string): Promise<KeystoneAnswers> {
  // Round A — product briefing. Normalize the name (lowercase, spaces to hyphens) so a human form
  // like "Optograph" or "My App" is accepted, then validate it the moment we have it, before asking
  // the remaining questions: a name that is still invalid after normalizing is a dead end, so
  // surfacing it now spares the user the whole questionnaire only to be rejected at creation time.
  // createProject re-normalizes and re-checks as the real guard; this is the early, friendly failure.
  const rawName = presetName ?? (await prompter.text('What is the project called?'))
  const name = normalizeProjectName(rawName)
  // Tell the user when the name was adjusted (case or spaces), so the change is visible at the
  // moment it happens — not discovered later in the created path. Compare against the trimmed raw
  // so leading/trailing spaces alone (already dropped) don't trigger a noisy notice.
  if (name !== rawName.trim()) {
    prompter.notice(
      `Using "${name}" — project names are lowercase, with spaces turned into hyphens.`,
    )
  }
  assertValidProjectName(name)

  const type = await prompter.choice<ProjectType>('What kind of project is it?', [
    { value: 'site', label: 'Site / page (brochure, landing)' },
    { value: 'system', label: 'System with login and data (dashboard, app area)' },
    { value: 'service', label: 'Service that talks to other systems (an entry point)' },
    { value: 'mobile', label: 'Mobile app' },
  ])
  // Fail fast on a type with no template yet (mobile): warn the moment it is chosen, not
  // after the user answers seven more questions only to hit "No template yet" at the end.
  // createProject enforces this too — this is the early, respectful stop.
  if (!TEMPLATE_EXISTS_FOR(type)) {
    throw new Error(
      `Keystone has no template for a "${type}" project yet — only site, system, and service. ` +
        `Stopping now so you don't answer the rest of the briefing for nothing.`,
    )
  }

  const language = await prompter.choice<string>('Starting language?', [
    { value: 'pt', label: 'Portuguese' },
    { value: 'en', label: 'English' },
    { value: 'es', label: 'Spanish' },
    { value: 'other', label: 'Other' },
  ])

  const screen = await prompter.choice<ScreenPriority>('Screen priority?', [
    { value: 'mobile', label: 'Mobile first' },
    { value: 'desktop', label: 'Desktop first' },
    { value: 'both', label: 'Both equally' },
  ])

  const sensitive = await prompter.choice<boolean>(
    'Does it handle sensitive data or money (personal data, payment, health, legal)?',
    [
      { value: true, label: 'Yes' },
      { value: false, label: 'No' },
    ],
  )

  // Multi-tenancy is asked, not assumed — and only for database-backed types (system/service);
  // a plain site has no database, so the question would be noise. The answer decides whether the
  // generated project gets tenant isolation (tenant_id + row-level security) or the simpler
  // single-owner database. This is the "ask, don't impose" principle: the template must not
  // presume every project is a multi-client SaaS.
  let multiTenant: boolean | undefined
  let superAdmin: boolean | undefined
  let auditLog: boolean | undefined
  if (type === 'system' || type === 'service') {
    multiTenant = await prompter.choice<boolean>(
      'Does it serve multiple separate clients, each seeing only their own data?',
      [
        { value: true, label: 'Yes — isolate each client’s data (multi-tenant)' },
        { value: false, label: 'No — one owner or internal use (single-tenant)' },
      ],
    )

    // Both super-admin and the audit log are asked, not assumed, and only inside the
    // multi-tenant path where they make sense — a single-owner project has no other tenants to
    // administer and rarely needs a tamper-proof cross-tenant log. Neither is imposed.
    if (multiTenant) {
      superAdmin = await prompter.choice<boolean>(
        'Include a super-admin that can see across all clients (for support/administration)?',
        [
          { value: true, label: 'Yes — add a cross-tenant super-admin role' },
          { value: false, label: 'No — every session is scoped to one client' },
        ],
      )
      auditLog = await prompter.choice<boolean>(
        'Include a permanent, tamper-proof record of who changed what (audit log)?',
        [
          { value: true, label: 'Yes — add an append-only audit log' },
          { value: false, label: 'No — no audit log' },
        ],
      )
    }
  }

  // Round B — technical setup
  const versionTarget = await prompter.choice<VersionTarget>('Where to version the code?', [
    { value: 'github', label: 'GitHub' },
    { value: 'gitlab', label: 'GitLab' },
    { value: 'local', label: 'Local only (no cloud)' },
  ])

  const isPrivate = await prompter.choice<boolean>('Visibility?', [
    { value: false, label: 'Public' },
    { value: true, label: 'Private' },
  ])

  const parentDir = await prompter.text(
    'Parent folder (Keystone creates the project folder inside it)?',
  )

  return {
    // Attach a tenancy flag only when it was actually asked. Under exactOptionalPropertyTypes an
    // optional field must be absent — not present-but-undefined — when it has no answer, and
    // create.ts depends on that absence as a distinct third state (a plain site, never asked)
    // that it must not confuse with an explicit false (a database project chosen single-tenant).
    product: {
      name,
      type,
      language,
      screen,
      sensitive,
      ...(multiTenant !== undefined ? { multiTenant } : {}),
      ...(superAdmin !== undefined ? { superAdmin } : {}),
      ...(auditLog !== undefined ? { auditLog } : {}),
    },
    setup: { versionTarget, isPrivate, parentDir },
  }
}
