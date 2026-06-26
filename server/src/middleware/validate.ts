import type { ZodSchema } from 'zod'
import type { Request, Response, NextFunction } from 'express'

export const validateBody =
  <T>(schema: ZodSchema<T>) =>
  (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body)
    if (!result.success) {
      res.status(400).json({ error: result.error.flatten() })
      return
    }
    res.locals.body = result.data
    next()
  }
