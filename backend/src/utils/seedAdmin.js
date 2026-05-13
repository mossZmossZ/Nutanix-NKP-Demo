const User = require('../models/User')

const seedAdmin = async () => {
  try {
    const exists = await User.findOne({ role: 'admin' })
    if (exists) return

    const { ADMIN_USERNAME, ADMIN_PASSWORD } = process.env
    if (!ADMIN_USERNAME || !ADMIN_PASSWORD) {
      console.warn('[seed] ADMIN_USERNAME / ADMIN_PASSWORD not set — skipping admin seed')
      return
    }

    await User.create({
      username: ADMIN_USERNAME,
      passwordHash: ADMIN_PASSWORD,
      role: 'admin',
      portalAccess: ['demo', 'workshop'],
      active: true,
    })
    console.log(`[seed] Admin created: ${ADMIN_USERNAME}`)
  } catch (err) {
    console.error('[seed] Failed to seed admin:', err.message)
  }
}

module.exports = seedAdmin
