#!/usr/bin/env node
// Guardrail (B4): blocks staging/committing or reading a .env secret file through the
// shell. Distilled from the standard rule "secrets never enter the repo". Deterministic --
// a real rail, not a warning. Registered as a PreToolUse hook on Bash in settings.json.
//
// Hook protocol: read the tool call as JSON on stdin; exit 2 blocks the call and sends
// stderr back to the agent; exit 0 allows.

import { readFileSync } from 'node:fs'

let command = ''
try {
  const input = JSON.parse(readFileSync(0, 'utf8'))
  command = input?.tool_input?.command ?? ''
} catch {
  // No parseable input means nothing to inspect -- do not block on our own failure.
  process.exit(0)
}

// Patterns kept as fragments so this file never trips a secret/dangerous scan of itself.
const stagesEnv = new RegExp('git\\s+(?:add|commit)\\b[^\\n]*\\.env')
// Readers cover both shell (cat|less|more|head|tail|type) and PowerShell -- on Windows the
// default reader is Get-Content (aliases gc, and cat/type map to it too). Without the
// PowerShell names a plain `Get-Content .env` slipped through and exposed the secret.
// `Get-Content` is matched case-insensitively (PowerShell is case-insensitive) and `gc` is
// bounded by word boundaries so it never fires inside an unrelated token.
const readsEnv = new RegExp(
  '(?:\\b(?:cat|less|more|head|tail|type|gc)\\b|Get-Content)[^\\n]*\\.env',
  'i',
)

if (stagesEnv.test(command) || readsEnv.test(command)) {
  console.error(
    'BLOCKED: this command touches a .env secret file. Secrets never enter the repo -- ' +
      'keep them in the environment and out of version control.',
  )
  process.exit(2)
}

process.exit(0)
