// The wizard: it conducts the briefing, one question at a time, through a Prompter.
// Plain-text mode runs in any terminal with zero AI cost — faithful to the DNA.
// The content of the questions is the same whether asked as text or as cards.
// See docs/setup-wizard.md.

import type { Prompter } from './prompter.ts'
import { assertValidProjectName, TEMPLATE_EXISTS_FOR } from './create.ts'
import type {
  KeystoneAnswers,
  ProjectType,
  ScreenPriority,
  LookChoice,
  VersionTarget,
} from './types.ts'

/** Run the full briefing (round A + round B) and return the collected answers. */
export async function runWizard(prompter: Prompter, presetName?: string): Promise<KeystoneAnswers> {
  // Round A — product briefing
  const name = presetName ?? (await prompter.text('What is the project called?'))
  // Validate the name the moment we have it, before asking the remaining questions: a bad
  // name (space, uppercase) is a dead end, so surfacing it now spares the user the whole
  // questionnaire only to be rejected at creation time. createProject re-checks as the real
  // guard; this is the early, friendly failure. See docs/setup-wizard.md.
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

  const look = await prompter.choice<LookChoice>('The project’s look?', [
    { value: 'generate', label: 'Let the design step create it (from the product’s essence)' },
    { value: 'import', label: 'Import my own (existing brand / design)' },
    { value: 'later', label: 'Decide later (start with a neutral default)' },
  ])

  const sensitive = await prompter.choice<boolean>(
    'Does it handle sensitive data or money (personal data, payment, health, legal)?',
    [
      { value: true, label: 'Yes' },
      { value: false, label: 'No' },
    ],
  )

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
    product: { name, type, language, screen, look, sensitive },
    setup: { versionTarget, isPrivate, parentDir },
  }
}
