#!/usr/bin/env node
// Guardrail (B4): blocks a commit or push straight onto a protected branch
// (main/master/production). Distilled from the standard branch-flow rule: nothing lands on
// a protected branch unreviewed -- work goes through a feature branch and a pull request.
// Deterministic. Registered as a PreToolUse hook on Bash in settings.json.
//
// Hook protocol: exit 2 blocks and sends stderr to the agent; exit 0 allows.

import { readFileSync } from 'node:fs'
import { execSync } from 'node:child_process'

let command = ''
try {
  const input = JSON.parse(readFileSync(0, 'utf8'))
  command = input?.tool_input?.command ?? ''
} catch {
  process.exit(0)
}

// Only a commit or push can land code on a branch; everything else is free.
if (!new RegExp('git\\s+(?:commit|push)\\b').test(command)) process.exit(0)

const PROTECTED = new Set(['main', 'master', 'production'])

// A push can target a protected branch from ANY current branch via an explicit refspec
// (`git push origin HEAD:main`, `git push origin feature:main`). Checking only the current
// branch missed exactly this case, so inspect the push destination first. The destination is
// the part after the colon in a `src:dst` refspec; a bare `refs/heads/` prefix is stripped so
// `HEAD:refs/heads/main` is caught too. If any refspec on the command targets a protected
// branch, block regardless of where HEAD currently points.
const pushMatch = command.match(new RegExp('git\\s+push\\b([^\\n]*)'))
if (pushMatch) {
  const args = pushMatch[1]
  // Match every `something:destination` token; the destination is what the push writes to.
  for (const refspec of args.matchAll(/(\S+):(\S+)/g)) {
    const dst = refspec[2].replace(/^refs\/heads\//, '')
    if (PROTECTED.has(dst)) {
      console.error(
        `BLOCKED: this push targets protected branch "${dst}". Work on a feature branch and ` +
          `open a reviewed pull request -- nothing lands on ${dst} unreviewed.`,
      )
      process.exit(2)
    }
  }
}

let branch = ''
try {
  branch = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim()
} catch {
  // Not a git repo, or a detached HEAD -- nothing to protect.
  process.exit(0)
}

if (PROTECTED.has(branch)) {
  console.error(
    `BLOCKED: "${branch}" is a protected branch. Work on a feature branch and open a ` +
      `reviewed pull request -- nothing lands on ${branch} unreviewed.`,
  )
  process.exit(2)
}

process.exit(0)
