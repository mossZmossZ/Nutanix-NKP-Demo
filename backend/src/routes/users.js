const router = require('express').Router()
const { protect, requireRole } = require('../middleware/auth')
const User = require('../models/User')

// GET /api/users/me
router.get('/me', protect, (req, res) => {
  res.json(req.user.toSafeObject())
})

// GET /api/users/:id/portal-access
router.get('/:id/portal-access', protect, async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('portalAccess role')
    if (!user) return res.status(404).json({ message: 'User not found' })
    res.json({ portalAccess: user.portalAccess, role: user.role })
  } catch (err) {
    next(err)
  }
})

// GET /api/users — admin only
router.get('/', protect, requireRole('admin'), async (req, res, next) => {
  try {
    const users = await User.find().select('-passwordHash').sort('-createdAt')
    res.json(users)
  } catch (err) {
    next(err)
  }
})

// PATCH /api/users/:id/portal-access — admin only
router.patch('/:id/portal-access', protect, requireRole('admin'), async (req, res, next) => {
  try {
    const { portalAccess } = req.body
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { portalAccess },
      { new: true, runValidators: true }
    ).select('-passwordHash')
    if (!user) return res.status(404).json({ message: 'User not found' })
    res.json(user.toSafeObject())
  } catch (err) {
    next(err)
  }
})

module.exports = router
