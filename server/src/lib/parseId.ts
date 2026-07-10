import { z } from 'zod'
import type { Response } from 'express'

const idSchema = z.coerce.number().int().positive()

/** Parses a route or query param as a positive integer; sends 400 and returns null on failure. */
export function parseId(param: unknown, res: Response): number | null {
  const parsed = idSchema.safeParse(param)
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid id' })
    return null
  }
  return parsed.data
}
