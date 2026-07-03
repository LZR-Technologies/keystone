// Flags files that grew too large to stay easy to understand.
// See docs/code-quality.md item 3.

import type { Guard } from './types.ts'

// 400 lines is the point past which a single file stops fitting comfortably in one reviewer's
// head and usually signals more than one responsibility living together. It is deliberately a
// soft ceiling — the guard advises splitting, it does not hard-fail — and lines up with the
// code-quality pillar's guidance (docs/code-quality.md item 3), so the number is a shared,
// documented convention rather than an arbitrary constant.
const MAX_LINES = 400

export const scanSize: Guard = (file, content) => {
  const lines = content.split('\n').length
  if (lines > MAX_LINES) {
    return [
      {
        guard: 'size',
        file,
        line: lines,
        // Keep "consider splitting" (advisory tone) and add the doc reference so the message
        // names the convention it comes from — the "speaking watchdog" house rule.
        message: `File has ${lines} lines (max ${MAX_LINES}) — consider splitting it (see docs/code-quality.md)`,
      },
    ]
  }
  return []
}
