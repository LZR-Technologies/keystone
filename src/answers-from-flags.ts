// Build the full set of answers from command-line flags, for a NON-INTERACTIVE `new` run — so an
// AI agent (or a script) that already collected the answers can create a project in one shot, with
// no wizard to reverse-engineer. This exists because the interactive wizard forces any programmatic
// caller to discover the exact question order and feed numbered lines blindly; flags make the intent
// explicit and order-independent.
//
// Contract: when --type is absent there are no answer flags, so this returns null and the caller
// runs the interactive wizard. When --type IS present the caller is committing to non-interactive
// mode, so EVERY required answer must be a valid flag — a missing or invalid one throws a clear
// error rather than silently falling back to asking, which would reopen the very wizard the caller
// was avoiding.

import type { KeystoneAnswers, ProjectType, ScreenPriority, VersionTarget } from './types.ts'

/** Read a flag value, supporting both `--flag value` and `--flag=value`. */
function flagValue(args: string[], flag: string): string | undefined {
  const joined = args.find((a) => a.startsWith(`${flag}=`))
  if (joined !== undefined) return joined.slice(flag.length + 1)
  const i = args.indexOf(flag)
  if (i >= 0) {
    const next = args[i + 1]
    // The value is the next token, unless it's another flag (meaning this flag was given no value).
    if (next !== undefined && !next.startsWith('--')) return next
  }
  return undefined
}

/** Require a flag to be present and non-empty, naming it clearly when it is missing. */
function required(args: string[], flag: string): string {
  const value = flagValue(args, flag)
  if (value === undefined || value === '') {
    throw new Error(`Non-interactive creation is missing the required flag ${flag}.`)
  }
  return value
}

/** Validate a value against the allowed options, throwing with the flag name and options on miss. */
function oneOf<T extends string>(value: string, allowed: readonly T[], flag: string): T {
  if ((allowed as readonly string[]).includes(value)) return value as T
  throw new Error(`${flag} must be one of: ${allowed.join(', ')} (got "${value}").`)
}

/** Parse a required yes/no flag into a boolean, or throw naming the flag. */
function yesNo(args: string[], flag: string): boolean {
  const value = required(args, flag)
  if (value === 'yes') return true
  if (value === 'no') return false
  throw new Error(`${flag} must be "yes" or "no" (got "${value}").`)
}

/**
 * Build answers from flags, or return null when no answer flags are present (--type absent),
 * signalling the caller to run the interactive wizard instead. Mirrors the wizard's own shape:
 * multi-tenancy is only read for database-backed types, and super-admin/audit-log only inside a
 * multi-tenant "yes" — so the flags required match exactly the questions the wizard would ask.
 */
export function answersFromFlags(args: string[], name: string | undefined): KeystoneAnswers | null {
  if (flagValue(args, '--type') === undefined) return null

  if (name === undefined) {
    throw new Error('A project name is required: keystone new <name> --type <...> …')
  }

  const type: ProjectType = oneOf(
    required(args, '--type'),
    ['site', 'system', 'service', 'mobile'] as const,
    '--type',
  )
  const language = oneOf(
    required(args, '--language'),
    ['pt', 'en', 'es', 'other'] as const,
    '--language',
  )
  const screen: ScreenPriority = oneOf(
    required(args, '--screen'),
    ['mobile', 'desktop', 'both'] as const,
    '--screen',
  )
  const sensitive = yesNo(args, '--sensitive')

  // Multi-tenancy is only meaningful for database-backed types (system/service); for a plain site or
  // mobile the flag is neither required nor recorded — matching the wizard, which never asks it. And
  // super-admin/audit-log only apply inside a multi-tenant "yes", required there and absent otherwise.
  let multiTenant: boolean | undefined
  let superAdmin: boolean | undefined
  let auditLog: boolean | undefined
  if (type === 'system' || type === 'service') {
    multiTenant = yesNo(args, '--multi-tenant')
    if (multiTenant) {
      superAdmin = yesNo(args, '--super-admin')
      auditLog = yesNo(args, '--audit-log')
    }
  }

  const versionTarget: VersionTarget = oneOf(
    required(args, '--version-target'),
    ['github', 'gitlab', 'local'] as const,
    '--version-target',
  )
  const isPrivate = yesNo(args, '--private')
  const parentDir = required(args, '--dir')

  return {
    // Optional tenancy fields are attached only when actually asked — createProject depends on the
    // absence (not present-but-undefined) as a distinct "never asked" state. See wizard.ts.
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
