import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'

const db = new PrismaClient()

async function main() {
  // Seed forum categories
  const cats = [
    { slug: 'general', name: 'General' },
    { slug: 'match-threads', name: 'Match Threads' },
    { slug: 'news', name: 'News' },
    { slug: 'lft', name: 'LFT / Recruiting' },
    { slug: 'off-topic', name: 'Off Topic' },
  ]

  for (const c of cats) {
    await db.forumCategory.upsert({
      where: { slug: c.slug },
      update: {},
      create: c,
    })
  }

  console.log('✓ Seeded forum categories')

  // Optionally create admin user if env vars are set
  if (process.env.BOOTSTRAP_ADMIN_EMAIL && process.env.BOOTSTRAP_ADMIN_PASS) {
    const hash = await bcrypt.hash(process.env.BOOTSTRAP_ADMIN_PASS, 11)
    await db.user.upsert({
      where: { email: process.env.BOOTSTRAP_ADMIN_EMAIL },
      update: { role: 'ADMIN', passwordHash: hash },
      create: {
        email: process.env.BOOTSTRAP_ADMIN_EMAIL,
        username: 'admin',
        passwordHash: hash,
        role: 'ADMIN',
      },
    })
    console.log('✓ Created/updated admin user')
  }

  console.log('Seed complete!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
