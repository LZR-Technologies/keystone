// The wizard talks to a Prompter, not to the terminal directly.
// Why: this keeps the question flow testable (a scripted prompter feeds answers
// in tests, with no flaky piping), and lets a richer UI — cards inside an AI
// assistant — plug in later without touching the wizard. See docs/setup-wizard.md.

import * as readline from 'node:readline/promises'
import { stdin as input, stdout as output } from 'node:process'

export interface Choice<T> {
  value: T
  label: string
}

export interface Prompter {
  text(question: string): Promise<string>
  choice<T>(question: string, choices: Choice<T>[]): Promise<T>
  /** Show the user an informational message that is not a question (e.g. "the name was adjusted"). */
  notice(message: string): void
  close(): void
}

/** Real prompter: reads from the keyboard in plain text, zero AI cost. */
export class ReadlinePrompter implements Prompter {
  private rl = readline.createInterface({ input, output })

  // Own line queue instead of rl.question(): readline DISCARDS lines that arrive while
  // no question is pending, and a pipe delivers all its lines at once — so with
  // question() a piped `keystone new` lost every answer after the first and then hung
  // (or died with an unsettled top-level await) when stdin closed. Buffering every
  // line makes piped/scripted input first-class, and end-of-input becomes a clear,
  // catchable error instead of a hang.
  private queued: string[] = []
  private waiting: { resolve: (line: string) => void; reject: (err: Error) => void }[] = []
  private isClosed = false

  constructor() {
    this.rl.on('line', (line) => {
      const waiter = this.waiting.shift()
      if (waiter) waiter.resolve(line)
      else this.queued.push(line)
    })
    this.rl.on('close', () => {
      this.isClosed = true
      for (const waiter of this.waiting.splice(0)) {
        waiter.reject(new Error('Input ended before all questions were answered.'))
      }
    })
  }

  private ask(prompt: string): Promise<string> {
    output.write(prompt)
    // Serve an already-buffered line first (piped input), then fall back to waiting.
    const buffered = this.queued.shift()
    if (buffered !== undefined) return Promise.resolve(buffered)
    if (this.isClosed) {
      return Promise.reject(new Error('Input ended before all questions were answered.'))
    }
    return new Promise((resolve, reject) => this.waiting.push({ resolve, reject }))
  }

  async text(question: string): Promise<string> {
    let answer = ''
    while (answer.trim() === '') {
      answer = (await this.ask(`${question} `)).trim()
    }
    return answer
  }

  async choice<T>(question: string, choices: Choice<T>[]): Promise<T> {
    output.write(`${question}\n`)
    choices.forEach((c, i) => output.write(`  ${i + 1}) ${c.label}\n`))
    // Never trust raw input: loop until the typed number maps to a real option.
    // An out-of-range index yields undefined, which also covers the range check.
    while (true) {
      const picked = Number((await this.ask('> ')).trim())
      const chosen = Number.isInteger(picked) ? choices[picked - 1] : undefined
      if (chosen) {
        return chosen.value
      }
      output.write(`Please type a number between 1 and ${choices.length}.\n`)
    }
  }

  notice(message: string): void {
    output.write(`${message}\n`)
  }

  close(): void {
    this.rl.close()
  }
}

/** Scripted prompter for tests and automation: answers come from a list, in order. */
export class ScriptedPrompter implements Prompter {
  private index = 0
  private readonly answers: string[]
  /** Notices emitted during the run, in order — so tests can assert on them without a terminal. */
  readonly notices: string[] = []

  constructor(answers: string[]) {
    this.answers = answers
  }

  async text(): Promise<string> {
    return this.next()
  }

  async choice<T>(_question: string, choices: Choice<T>[]): Promise<T> {
    const picked = Number(this.next())
    const chosen = Number.isInteger(picked) ? choices[picked - 1] : undefined
    if (!chosen) {
      throw new Error(`Scripted answer out of range: ${picked}`)
    }
    return chosen.value
  }

  notice(message: string): void {
    this.notices.push(message)
  }

  private next(): string {
    const value = this.answers[this.index]
    if (value === undefined) {
      throw new Error('Scripted prompter ran out of answers')
    }
    this.index += 1
    return value
  }

  close(): void {}
}
