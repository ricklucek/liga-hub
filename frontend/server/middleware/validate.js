/**
 * Zod validation middleware factory.
 * @param {import('zod').ZodSchema} schema - Zod schema to validate against
 * @param {'body'|'query'} pick - Which part of the request to validate
 */
export const validate = (schema, pick = 'body') => (req, res, next) => {
  const data = pick === 'query' ? req.query : req.body
  const parsed = schema.safeParse(data)

  if (!parsed.success) {
    return res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() })
  }

  if (pick === 'query') {
    req.query = parsed.data
  } else {
    req.body = parsed.data
  }

  next()
}
