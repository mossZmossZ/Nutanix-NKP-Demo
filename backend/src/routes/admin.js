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
    const [totalUsers, demoUsers, workshopUsers, totalCredentials, totalWorkshops, totalPages] = await Promise.all([
      User.countDocuments({ role: { $ne: 'admin' } }),
      User.countDocuments({ portalAccess: 'demo' }),
      User.countDocuments({ portalAccess: 'workshop' }),
      Credential.countDocuments({ active: true }),
      require('../models/Workshop').countDocuments({ active: true }),
      require('../models/WorkshopPage').countDocuments({ published: true }),
    ])
    res.json({ totalUsers, demoUsers, workshopUsers, totalCredentials, totalWorkshops, totalPages })
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
    const user = await User.findById(req.params.id)
    if (!user) return res.status(404).json({ message: 'User not found' })

    // Remove lab container if one exists
    const ContainerSession = require('../models/ContainerSession')
    const docker = require('../lib/docker')
    const session = await ContainerSession.findOne({ userId: req.params.id })
    if (session?.containerId) {
      try {
        await docker.getContainer(session.containerId).remove({ force: true })
      } catch (e) {
        if (e.statusCode !== 404) console.error('Container cleanup error:', e.message)
      }
    }
    if (session) await session.deleteOne()

    await user.deleteOne()
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

// ─── Workshops ────────────────────────────────────────────────────────────────
const Workshop     = require('../models/Workshop')
const WorkshopPage = require('../models/WorkshopPage')
const WorkshopCred = require('../models/WorkshopCredential')

router.get('/workshops', ...adminOnly, async (req, res, next) => {
  try {
    const workshops = await Workshop.find().populate('assignedUsers', 'username').sort('-createdAt')
    res.json(workshops)
  } catch (err) { next(err) }
})

router.post('/workshops', ...adminOnly,
  [body('title').trim().notEmpty().withMessage('Title is required')],
  async (req, res, next) => {
    if (!validate(req, res)) return
    try {
      const { title, description, credentialFields, assignedUsers } = req.body
      const w = await Workshop.create({
        title, description,
        credentialFields: credentialFields || [],
        assignedUsers: assignedUsers || [],
      })
      res.status(201).json(w)
    } catch (err) { next(err) }
  }
)

router.put('/workshops/:id', ...adminOnly, async (req, res, next) => {
  try {
    const w = await Workshop.findById(req.params.id)
    if (!w) return res.status(404).json({ message: 'Workshop not found' })
    const { title, description, credentialFields, assignedUsers, active } = req.body
    if (title !== undefined)            w.title            = title
    if (description !== undefined)      w.description      = description
    if (credentialFields !== undefined) w.credentialFields = credentialFields
    if (assignedUsers !== undefined)    w.assignedUsers    = assignedUsers
    if (active !== undefined)           w.active           = active
    await w.save()
    res.json(w)
  } catch (err) { next(err) }
})

router.delete('/workshops/:id', ...adminOnly, async (req, res, next) => {
  try {
    await Workshop.findByIdAndDelete(req.params.id)
    await WorkshopPage.deleteMany({ workshopId: req.params.id })
    res.json({ message: 'Workshop deleted' })
  } catch (err) { next(err) }
})

// Workshop pages
router.get('/workshops/:id/pages', ...adminOnly, async (req, res, next) => {
  try {
    const pages = await WorkshopPage.find({ workshopId: req.params.id }).sort('order')
    res.json(pages)
  } catch (err) { next(err) }
})

router.post('/workshops/:id/pages', ...adminOnly,
  [body('title').trim().notEmpty().withMessage('Page title is required')],
  async (req, res, next) => {
    if (!validate(req, res)) return
    try {
      const { title, content, published } = req.body
      const count = await WorkshopPage.countDocuments({ workshopId: req.params.id })
      const page = await WorkshopPage.create({
        workshopId: req.params.id,
        title,
        content: content || '',
        order: count,
        published: published !== false,
      })
      res.status(201).json(page)
    } catch (err) { next(err) }
  }
)

router.put('/workshops/:id/pages/:pageId', ...adminOnly, async (req, res, next) => {
  try {
    const page = await WorkshopPage.findOne({ _id: req.params.pageId, workshopId: req.params.id })
    if (!page) return res.status(404).json({ message: 'Page not found' })
    const { title, content, order, published } = req.body
    if (title !== undefined)     page.title     = title
    if (content !== undefined)   page.content   = content
    if (order !== undefined)     page.order     = order
    if (published !== undefined) page.published = published
    await page.save()
    res.json(page)
  } catch (err) { next(err) }
})

router.delete('/workshops/:id/pages/:pageId', ...adminOnly, async (req, res, next) => {
  try {
    await WorkshopPage.findOneAndDelete({ _id: req.params.pageId, workshopId: req.params.id })
    res.json({ message: 'Page deleted' })
  } catch (err) { next(err) }
})

// Workshop credentials (per-user)
router.get('/workshop-credentials', ...adminOnly, async (req, res, next) => {
  try {
    const creds = await WorkshopCred.find()
      .populate('workshopId', 'title credentialFields')
      .populate('userId', 'username')
      .sort('-createdAt')
    res.json(creds)
  } catch (err) { next(err) }
})

router.post('/workshop-credentials', ...adminOnly,
  [body('workshopId').notEmpty().withMessage('Workshop is required')],
  async (req, res, next) => {
    if (!validate(req, res)) return
    try {
      const { workshopId, userId, isGlobal, fields } = req.body
      if (!isGlobal && !userId) {
        return res.status(400).json({ message: 'User is required' })
      }
      const query  = isGlobal ? { workshopId, isGlobal: true } : { workshopId, userId }
      const update = isGlobal
        ? { $set: { fields: fields || [], isGlobal: true, userId: null } }
        : { $set: { fields: fields || [], isGlobal: false } }
      const cred = await WorkshopCred.findOneAndUpdate(query, update, { upsert: true, new: true })
        .populate('workshopId', 'title credentialFields')
        .populate('userId', 'username')
      res.status(201).json(cred)
    } catch (err) { next(err) }
  }
)

router.put('/workshop-credentials/:id', ...adminOnly, async (req, res, next) => {
  try {
    const cred = await WorkshopCred.findById(req.params.id)
    if (!cred) return res.status(404).json({ message: 'Not found' })
    if (req.body.fields !== undefined) cred.fields = req.body.fields
    await cred.save()
    res.json(cred)
  } catch (err) { next(err) }
})

router.delete('/workshop-credentials/:id', ...adminOnly, async (req, res, next) => {
  try {
    await WorkshopCred.findByIdAndDelete(req.params.id)
    res.json({ message: 'Deleted' })
  } catch (err) { next(err) }
})

module.exports = router
