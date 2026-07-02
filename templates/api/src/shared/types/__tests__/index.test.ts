import { describe, expect, it } from 'vitest'

import {
  AppError,
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
  ValidationError,
  fail,
  ok,
} from '../index.js'

// The barrel (index.ts) is the module's declared public surface — other
// modules import from here, never from result.js/error.js directly (see
// CLAUDE.md). It has no logic of its own, but an untested barrel can still
// silently drop or misname an export; importing every symbol through it (not
// through the individual files) is what actually proves the public surface
// works, not just the files behind it.
describe('shared/types barrel', () => {
  it('re-exports the Result helpers', () => {
    expect(ok('value')).toEqual({ success: true, data: 'value' })
    expect(fail('error')).toEqual({ success: false, error: 'error' })
  })

  it('re-exports AppError and its subclasses', () => {
    expect(new AppError(500, 'type', 'title', 'detail')).toBeInstanceOf(AppError)
    expect(new ValidationError('bad input')).toBeInstanceOf(AppError)
    expect(new NotFoundError('thing')).toBeInstanceOf(AppError)
    expect(new UnauthorizedError()).toBeInstanceOf(AppError)
    expect(new ForbiddenError()).toBeInstanceOf(AppError)
  })
})
