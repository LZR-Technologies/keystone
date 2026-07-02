import { NextResponse } from 'next/server'
import { z } from 'zod'

import { renameItemById } from '../store'

import type { ProblemDetail } from '@/lib/types'

// Every external input is validated at the boundary (security convention in
// CLAUDE.md) -- the request body is untrusted until it passes this schema.
const renameSchema = z.object({
  name: z.string().trim().min(1, 'name must not be empty').max(200),
})

function problem(status: number, title: string, detail: string): ProblemDetail {
  // RFC 9457 Problem Details, matching the shape src/lib/fetch.ts already
  // expects on the client side -- the two must agree, since apiFetch parses
  // any non-2xx body as this exact interface.
  return { type: `https://api.example.com/errors/${status}`, title, status, detail }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(problem(400, 'Bad Request', 'Request body must be valid JSON.'), {
      status: 400,
    })
  }

  const parsed = renameSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      problem(
        400,
        'Bad Request',
        // zod's SafeParseError guarantees a non-empty `issues` array with a
        // required `message: string` on every issue whenever `success` is
        // false -- verified against every malformed-input shape this schema
        // can reject. The ?. / ?? here is defensive against a zod contract
        // change, not a reachable branch today.
        /* v8 ignore next */
        parsed.error.issues[0]?.message ?? 'Invalid request body.',
      ),
      { status: 400 },
    )
  }

  const updated = renameItemById(id, parsed.data.name)
  if (!updated) {
    return NextResponse.json(problem(404, 'Not Found', `No item with id "${id}".`), {
      status: 404,
    })
  }

  return NextResponse.json(updated)
}
