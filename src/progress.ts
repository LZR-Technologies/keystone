// A console progress reporter for the post-create steps. In a real terminal it shows a spinner that
// turns into a check when the step finishes — the sign of life a slow dependency install was missing
// (it used to sit silent and look frozen). When output is NOT a TTY (piped or scripted — e.g. an AI
// agent feeding answers), there is no live viewer and carriage-return animation would just clutter
// the captured log, so the spinner is skipped and only the final mark is printed, exactly as before.

import { stdout } from 'node:process'
import type { ProgressReporter } from './post-create.ts'

// The classic spinner cycle, matching the "|  \  —  /" the product team pictured for the notice.
const FRAMES = ['|', '/', '—', '\\']
const FRAME_MS = 120

export function createConsoleReporter(): ProgressReporter {
  const isTTY = stdout.isTTY === true
  let timer: ReturnType<typeof setInterval> | undefined
  let label = ''

  return {
    start(stepLabel: string): void {
      label = stepLabel
      // Off a TTY, don't animate — the check printed on done() is the only signal, keeping piped
      // logs clean (one line per step, no stream of carriage returns).
      if (!isTTY) return
      let i = 0
      stdout.write(`  ${FRAMES[0]} ${label}`)
      timer = setInterval(() => {
        i = (i + 1) % FRAMES.length
        // \r returns to the line start so the frame animates in place. The label length is fixed
        // per step, so the check written on done() cleanly overwrites the last spinner frame.
        stdout.write(`\r  ${FRAMES[i]} ${label}`)
      }, FRAME_MS)
    },
    done(ok: boolean): void {
      if (timer) {
        clearInterval(timer)
        timer = undefined
      }
      const mark = ok ? '✓' : '✗'
      // On a TTY, overwrite the spinner line in place; otherwise just print the finished line.
      stdout.write(isTTY ? `\r  ${mark} ${label}\n` : `  ${mark} ${label}\n`)
    },
  }
}
