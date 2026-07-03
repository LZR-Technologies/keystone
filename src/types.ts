// The answers Keystone collects before creating a project.
// Only "type 3" decisions (the user's taste) live here; what Keystone deduces
// (need for a database, security level, visual foundation) is derived later,
// never asked. See docs/setup-wizard.md.

/** What kind of project is being created. Drives deduced choices downstream. */
export type ProjectType = 'site' | 'system' | 'service' | 'mobile'

/** Which screen the project should favor when nothing else is said. */
export type ScreenPriority = 'mobile' | 'desktop' | 'both'

/** How the project's visual identity is decided. */
export type LookChoice = 'generate' | 'import' | 'later'

/** Where the project's code will be versioned. */
export type VersionTarget = 'github' | 'gitlab' | 'local'

/** Round A — the product briefing (the minimal wizard). */
export interface ProductBriefing {
  name: string
  type: ProjectType
  /** Starting language, e.g. 'pt', 'en', 'es'. */
  language: string
  screen: ScreenPriority
  look: LookChoice
  /** Whether the project handles sensitive data or money — feeds the security level. */
  sensitive: boolean
}

/** Round B — the technical setup (where the project lives). */
export interface TechnicalSetup {
  versionTarget: VersionTarget
  isPrivate: boolean
  /** Parent folder on the machine; Keystone creates the project folder inside it. */
  parentDir: string
}

/** Everything Keystone needs to create a project. */
export interface KeystoneAnswers {
  product: ProductBriefing
  setup: TechnicalSetup
}
