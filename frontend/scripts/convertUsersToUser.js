#!/usr/bin/env node
import('../server/db.js').then(({ db }) => {
  ;(async () => {
    try {
      console.log('Updating all users to role=USER...')
      const result = await db.user.updateMany({ data: { role: 'USER' } })
      console.log('Updated users:', result)
    } catch (err) {
      console.error('Failed to update users:', err)
      process.exitCode = 1
    } finally {
      await db.$disconnect()
    }
  })()
})
