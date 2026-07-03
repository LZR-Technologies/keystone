// Flags dangerous code patterns — the injection and XSS vectors that deserve a
// human look before shipping. Deterministic, no AI. See docs/security.md item 1.5
// ("never trust incoming input") and 1.4.
//
// Like the secret scanner, every pattern is assembled from fragments on purpose:
// written whole, this file (and its tests) would match their own definitions and
// flag themselves when Keystone runs its own check. Split, the detector never
// recognizes itself — yet still catches the real thing. Same root-cause fix used
// in secrets.ts, not an exception.
//
// The set is deliberately high-confidence over exhaustive: each pattern here is
// dangerous in almost every context, so false positives stay rare. It is meant to
// grow — SQL string-building and unsafe deserialization are the next candidates —
// but a precise small net beats a noisy big one.

import type { Finding, Guard } from './types.ts'

// Dynamic code execution: runs a string as code. Almost never justified in app code.
const EVAL = new RegExp('\\b' + 'ev' + 'al\\s*\\(')
const DYNAMIC_FN = new RegExp('new\\s+' + 'Func' + 'tion\\s*\\(')

// Raw HTML injection: the two classic XSS sinks — React's escape hatch and a
// direct DOM write. The DOM one uses a negative lookahead so `===`/`==` comparisons
// are not mistaken for an assignment.
const REACT_HTML = new RegExp('dangerously' + 'SetInner' + 'HTML')
const DOM_HTML = new RegExp('\\.inner' + 'HTML\\s*=(?!=)')
const DOC_WRITE = new RegExp('document\\.' + 'wr' + 'ite\\s*\\(')

// Shell command built with an interpolated template literal = command injection.
// Restricted to the interpolation case on purpose: a plain constant command is
// fine, only a value spliced into the command string is the risk.
// The lookbehind excludes METHOD calls (`db.exec(...)`): every database driver
// exposes .exec/.query, and flagging those buried the real signal in noise. The
// shell primitives are called as bare imports in practice; a namespaced
// `cp.execSync(...)` slips through — accepted trade-off, consistent with this
// guard's stated philosophy (a precise small net beats a noisy big one).
const SHELL_EXEC = new RegExp('(?<!\\.)\\b' + 'ex' + 'ec(?:Sync)?\\s*\\(\\s*`[^`]*\\$\\{')

const DANGEROUS_PATTERNS: { name: string; re: RegExp }[] = [
  { name: 'dynamic code execution', re: EVAL },
  { name: 'dynamic function constructor', re: DYNAMIC_FN },
  { name: 'raw HTML injection (React escape hatch)', re: REACT_HTML },
  { name: 'raw HTML injection (direct DOM write)', re: DOM_HTML },
  { name: 'legacy document write (XSS vector)', re: DOC_WRITE },
  { name: 'shell command built with interpolation', re: SHELL_EXEC },
]

export const scanDangerous: Guard = (file, content) => {
  const findings: Finding[] = []
  content.split('\n').forEach((text, index) => {
    for (const { name, re } of DANGEROUS_PATTERNS) {
      if (re.test(text)) {
        findings.push({
          guard: 'dangerous',
          file,
          line: index + 1,
          // Point at the security pillar doc so the block names the rule it enforces, not
          // just the symptom — the "speaking watchdog" house rule.
          message: `Dangerous pattern — ${name} (injection/XSS risk); review before shipping — see docs/security.md`,
        })
      }
    }
  })
  return findings
}
