import { z } from 'zod'

const usernameRegex = /^[a-z0-9_]+$/i

export const registerSchema = z.object({
  email: z.string().email().max(120),
  username: z
    .string()
    .min(3)
    .max(20)
    .regex(usernameRegex, 'username must be alphanumeric/underscore'),
  password: z.string().min(8).max(72),
})

export const loginSchema = z.object({
  emailOrUsername: z.string().min(3).max(120),
  password: z.string().min(8).max(72),
})

export const createThreadSchema = z.object({
  categoryId: z.number().int().positive(),
  title: z.string().min(4).max(140),
  body: z.string().min(1).max(10000),
})

export const threadListQuery = z.object({
  categoryId: z
    .string()
    .optional()
    .transform((val) => (val ? Number.parseInt(val, 10) : undefined))
    .pipe(z.number().int().positive().optional()),
  sort: z.enum(['hot', 'new', 'top']).default('hot'),
  page: z
    .string()
    .optional()
    .transform((val) => (val ? Number.parseInt(val, 10) : 1))
    .pipe(z.number().int().positive().default(1)),
  pageSize: z
    .string()
    .optional()
    .transform((val) => (val ? Number.parseInt(val, 10) : 20))
    .pipe(z.number().int().min(1).max(50).default(20)),
})

export const threadParams = z.object({
  id: z
    .string()
    .transform((val) => Number.parseInt(val, 10))
    .pipe(z.number().int().positive()),
})

export const postsQuery = z.object({
  page: z
    .string()
    .optional()
    .transform((val) => (val ? Number.parseInt(val, 10) : 1))
    .pipe(z.number().int().positive().default(1)),
  pageSize: z
    .string()
    .optional()
    .transform((val) => (val ? Number.parseInt(val, 10) : 25))
    .pipe(z.number().int().min(1).max(50).default(25)),
})

export const replySchema = z.object({
  body: z.string().min(1).max(10000),
  parentId: z.number().int().positive().optional(),
})

export const voteSchema = z.object({
  value: z.union([z.literal(-1), z.literal(1)]),
})
