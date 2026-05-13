const router = require('express').Router()
const { body, validationResult } = require('express-validator')
const { protect, requireRole } = require('../middleware/auth')
const User = require('../models/User')
const Credential = require('../models/Credential')

const adminOnly = [protect, requireRole('admin')]
const validate = (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    res.status(400).json({ message: errors.array()[0].msg })
    return false
  }
  return true
}

// ─── Stats ────────────────────────────────────────────────────────────────────

router.get('/stats', ...adminOnly, async (req, res, next) => {
  try {
    const [totalUsers, demoUsers, workshopUsers, totalCredentials] = await Promise.all([
      User.countDocuments({ role: { $ne: 'admin' } }),
      User.countDocuments({ portalAccess: 'demo' }),
      User.countDocuments({ portalAccess: 'workshop' }),
      Credential.countDocuments({ active: true }),
    ])
    res.json({ totalUsers, demoUsers, workshopUsers, totalCredentials })
  } catch (err) { next(err) }
})

// ─── Users ────────────────────────────────────────────────────────────────────

router.get('/users', ...adminOnly, async (req, res, next) => {
  try {
    const users = await User.find().select('-passwordHash').sort('-createdAt')
    res.json(users)
  } catch (err) { next(err) }
})

router.post('/users',
  ...adminOnly,
  [
    body('username').trim().isLength({ min: 2, max: 50 }).withMessage('Username must be 2–50 characters'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    body('role').optional().isIn(['user', 'admin', 'instructor']),
    body('portalAccess').optional().isArray(),
  ],
  async (req, res, next) => {
    if (!validate(req, res)) return
    try {
      const { username, password, role, portalAccess } = req.body
      const user = await User.create({ username, passwordHash: password, role, portalAccess })
      res.status(201).json(user.toSafeObject())
    } catch (err) { next(err) }
  }
)

router.put('/users/:id',
  ...adminOnly,
  [
    body('username').optional().trim().isLength({ min: 2, max: 50 }),
    body('role').optional().isIn(['user', 'admin', 'instructor']),
    body('portalAccess').optional().isArray(),
  ],
  async (req, res, next) => {
    if (!validate(req, res)) return
    try {
      const { username, role, portalAccess, active, password } = req.body
      const user = await User.findById(req.params.id)
      if (!user) return res.status(404).json({ message: 'User not found' })

      if (username)      user.username     = username
      if (role)          user.role         = role
      if (portalAccess)  user.portalAccess = portalAccess
      if (active !== undefined) user.active = active
      if (password)      user.passwordHash = password  // triggers bcrypt pre-save

      await user.save()
      res.json(user.toSafeObject())
    } catch (err) { next(err) }
  }
)

router.delete('/users/:id', ...adminOnly, async (req, res, next) => {
  try {
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({ message: 'Cannot delete your own account' })
    }
    const user = await User.findByIdAndDelete(req.params.id)
    if (!user) return res.status(404).json({ message: 'User not found' })
    res.json({ message: 'User deleted' })
  } catch (err) { next(err) }
})

// ─── Credentials ──────────────────────────────────────────────────────────────

router.get('/credentials', ...adminOnly, async (req, res, next) => {
  try {
    const creds = await Credential.find().populate('assignedUsers', 'username').sort('-createdAt')
    res.json(creds.map(c => c.toObject()))
  } catch (err) { next(err) }
})

router.post('/credentials',
  ...adminOnly,
  [
    body('clusterName').trim().notEmpty().withMessage('Cluster name is required'),
    body('dashboardUrl').trim().notEmpty().withMessage('Dashboard URL is required'),
  ],
  async (req, res, next) => {
    if (!validate(req, res)) return
    try {
      const { clusterName, dashboardUrl, kubeconfigYaml, description, assignedUsers } = req.body
      const cred = await Credential.create({ clusterName, dashboardUrl, kubeconfigYaml, description, assignedUsers: assignedUsers || [] })
      res.status(201).json(cred.toSafeObject())
    } catch (err) { next(err) }
  }
)

router.put('/credentials/:id', ...adminOnly, async (req, res, next) => {
  try {
    const cred = await Credential.findById(req.params.id)
    if (!cred) return res.status(404).json({ message: 'Credential not found' })

    const { clusterName, dashboardUrl, kubeconfigYaml, description, active, assignedUsers } = req.body
    if (clusterName)   cred.clusterName  = clusterName
    if (dashboardUrl)  cred.dashboardUrl = dashboardUrl
    if (kubeconfigYaml !== undefined) cred.kubeconfigYaml = kubeconfigYaml
    if (description !== undefined)    cred.description    = description
    if (active !== undefined)         cred.active         = active
    if (assignedUsers !== undefined)  cred.assignedUsers  = assignedUsers

    await cred.save()
    res.json(cred.toSafeObject())
  } catch (err) { next(err) }
})

router.delete('/credentials/:id', ...adminOnly, async (req, res, next) => {
  try {
    const cred = await Credential.findByIdAndDelete(req.params.id)
    if (!cred) return res.status(404).json({ message: 'Credential not found' })
    res.json({ message: 'Credential deleted' })
  } catch (err) { next(err) }
})

// Download kubeconfig — accessible to admin + demo portal users
router.get('/credentials/:id/kubeconfig', protect, async (req, res, next) => {
  try {
    const cred = await Credential.findById(req.params.id)
    if (!cred) return res.status(404).json({ message: 'Credential not found' })

    // Admin or demo-portal user
    const canAccess = req.user.role === 'admin' || req.user.portalAccess.includes('demo')
    if (!canAccess) return res.status(403).json({ message: 'Access denied' })

    if (!cred.kubeconfigYaml) {
      return res.status(404).json({ message: 'No kubeconfig available for this cluster' })
    }

    const filename = `${cred.clusterName.replace(/\s+/g, '-').toLowerCase()}-kubeconfig.yaml`
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
    res.setHeader('Content-Type', 'application/x-yaml')
    res.send(cred.kubeconfigYaml)
  } catch (err) { next(err) }
})

module.exports = router
