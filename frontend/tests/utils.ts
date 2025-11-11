import fs from 'node:fs'
import path from 'node:path'
import { PrismaClient } from '@prisma/client'

export const prisma = new PrismaClient()

const migrationName = '20251110000000_init'
const migrationPath = path.resolve(
  process.cwd(),
  'prisma',
  'migrations',
  migrationName,
  'migration.sql',
)

const resolveSqlitePath = (url: string | undefined, fallback: string) => {
  const target = url ?? fallback
  if (!target.startsWith('file:')) {
    throw new Error('DATABASE_URL must be a sqlite file path for tests.')
  }
  const relative = target.replace('file:', '')
  if (relative.startsWith('./')) {
    return path.resolve(process.cwd(), 'prisma', relative.slice(2))
  }
  return path.resolve(process.cwd(), relative)
}

const testDbPath = resolveSqlitePath(process.env.DATABASE_URL, 'file:./data/test.db')
const testShadowPath = resolveSqlitePath(
  process.env.SHADOW_DATABASE_URL,
  'file:./data/test-shadow.db',
)

async function applyMigrations() {
  const sql = fs.readFileSync(migrationPath, 'utf8')
  const statements = sql
    .split(/;\s*(?:\r?\n|$)/)
    .map((statement) => statement.trim())
    .filter((statement) => statement.length)

  for (const statement of statements) {
    // eslint-disable-next-line no-await-in-loop
    await prisma.$executeRawUnsafe(statement)
  }
}

async function seedBaseData() {
  const categories = [
    { slug: 'general', name: 'General' },
    { slug: 'match-threads', name: 'Match Threads' },
    { slug: 'news', name: 'News' },
    { slug: 'lft', name: 'LFT / Recruiting' },
    { slug: 'off-topic', name: 'Off Topic' },
  ]
  await prisma.forumCategory.createMany({ data: categories })
}

export async function resetDatabase() {
  [testDbPath, testShadowPath].forEach((file) => {
    if (fs.existsSync(file)) {
      fs.unlinkSync(file)
    }
  })
  await applyMigrations()
  await seedBaseData()
}
