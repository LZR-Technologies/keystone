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
  /**
   * Whether the project serves multiple separate clients, each seeing only their own data.
   * Only asked for database-backed types (system/service); undefined for a plain site.
   * When explicitly false, the generated project gets the single-tenant database (no tenant_id,
   * no row-level security) and no tenant-isolation test — Keystone asks instead of assuming.
   */
  multiTenant?: boolean
  /**
   * Multi-tenant only (asked only when multiTenant is true). Whether to include a super-admin
   * role that sees across all tenants — the row-level-security policy gains an "or is a
   * super-admin" branch. Undefined/false leaves it out. Asked, not assumed.
   */
  superAdmin?: boolean
  /**
   * Multi-tenant only (asked only when multiTenant is true). Whether to include an append-only,
   * tamper-proof audit log (who did what, when) fed by a trigger. Undefined/false leaves it out.
   * Asked, not assumed.
   */
  auditLog?: boolean
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
