// Refuses code that leaks a secret — the most critical security guard.
// Deterministic, no AI. See docs/security.md item 1.3.
//
// The patterns are assembled from parts on purpose: written whole, this file
// would match its own definitions and flag itself. Split, the detector never
// recognizes itself — yet still catches real secrets. No exceptions needed.

import type { Finding, Guard } from './types.ts'

const AWS_KEY = new RegExp('AKIA' + '[0-9A-Z]{16}')
const API_ASSIGNMENT = new RegExp(
  '(?:api[_-]?key|secret|token)\\s*[:=]\\s*[\'"][^\'"]{12,}[\'"]',
  'i',
)
const PRIVATE_KEY = new RegExp('-----BEGIN (?:RSA |EC )?PRIVATE ' + 'KEY-----')
// Provider key formats caught by their own shape, not by the variable name — the most
// common real-world leak (a live Stripe key hardcoded as `const k = "sk_live_..."`)
// carries no telltale name, so name-based matching misses exactly the worst case.
const STRIPE_KEY = new RegExp('sk_' + 'live_[0-9a-zA-Z]{16,}')
const GITHUB_TOKEN = new RegExp('gh[pousr]_' + '[0-9A-Za-z]{20,}')
const SLACK_TOKEN = new RegExp('xox[baprs]-' + '[0-9A-Za-z-]{10,}')
// AI-provider keys — the commonest 2026 leak, as models moved into ordinary app code.
// Anthropic first: its prefix (sk-ant-) also begins with the OpenAI prefix (sk-), so the
// order matters only for which name is reported, but both would match; naming Anthropic
// explicitly keeps the message accurate. Length floors below match the real key formats
// while staying above short lookalikes, so a stray "sk-" in prose does not trip the guard.
const ANTHROPIC_KEY = new RegExp('sk-' + 'ant-[0-9A-Za-z-]{20,}')
// OpenAI ships two live shapes: the newer project-scoped key (sk-proj-...) and the classic
// account key (sk-...). Match the project prefix explicitly, and the classic form as sk-
// followed by a long run of key characters — the [0-9A-Za-z] class (no hyphen) is what
// keeps this from also matching the hyphenated Anthropic/proj keys as the "classic" shape.
const OPENAI_PROJECT_KEY = new RegExp('sk-' + 'proj-[0-9A-Za-z_-]{20,}')
const OPENAI_KEY = new RegExp('sk-' + '[0-9A-Za-z]{20,}')

const SECRET_PATTERNS: { name: string; re: RegExp }[] = [
  { name: 'AWS access key', re: AWS_KEY },
  { name: 'API key / token assignment', re: API_ASSIGNMENT },
  { name: 'Private key block', re: PRIVATE_KEY },
  { name: 'Stripe live key', re: STRIPE_KEY },
  { name: 'GitHub token', re: GITHUB_TOKEN },
  { name: 'Slack token', re: SLACK_TOKEN },
  // Anthropic and the OpenAI project key are listed before the classic OpenAI key so the
  // more specific provider name is reported when a key matches more than one shape.
  { name: 'Anthropic API key', re: ANTHROPIC_KEY },
  { name: 'OpenAI project key', re: OPENAI_PROJECT_KEY },
  { name: 'OpenAI API key', re: OPENAI_KEY },
]

export const scanSecrets: Guard = (file, content) => {
  const findings: Finding[] = []
  content.split('\n').forEach((text, index) => {
    for (const { name, re } of SECRET_PATTERNS) {
      if (re.test(text)) {
        findings.push({
          guard: 'secrets',
          file,
          line: index + 1,
          // Cite the pillar doc in the message so the block tells the user not just WHAT
          // tripped but WHERE the rule lives — the "speaking watchdog" house rule.
          message: `Possible exposed secret (${name}) — see docs/security.md`,
        })
      }
    }
  })
  return findings
}
