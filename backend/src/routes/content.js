const router = require('express').Router()
const { protect, requireRole, requirePortalAccess } = require('../middleware/auth')
const Content = require('../models/Content')

// GET /api/content — public listing (published only, no content body)
router.get('/', async (req, res, next) => {
  try {
    const filter = { published: true }
    if (req.query.portal) filter.portal = req.query.portal
    if (req.query.type) filter.type = req.query.type
    const items = await Content.find(filter).select('-content').sort('order')
    res.json(items)
  } catch (err) {
    next(err)
  }
})

// GET /api/content/:slug — public guide slug access
router.get('/:slug', async (req, res, next) => {
  try {
    const item = await Content.findOne({ slug: req.params.slug, published: true })
    if (!item) return res.status(404).json({ message: 'Content not found' })

    // Portal-specific content requires auth
    if (item.portal !== 'public' && item.portal !== 'installation') {
      return res.status(401).json({ message: 'Authentication required' })
    }
    res.json(item)
  } catch (err) {
    next(err)
  }
})

// GET /api/content/portal/:portalName — portal content (protected)
router.get('/portal/:portalName', protect, async (req, res, next) => {
  try {
    const { portalName } = req.params
    if (!['demo', 'workshop'].includes(portalName)) {
      return res.status(400).json({ message: 'Invalid portal name' })
    }

    if (req.user.role !== 'admin' && !req.user.portalAccess.includes(portalName)) {
      return res.status(403).json({ message: `No access to ${portalName} portal` })
    }

    const items = await Content.find({ portal: portalName, published: true }).sort('order')
    res.json(items)
  } catch (err) {
    next(err)
  }
})

// POST /api/content — admin only
router.post('/', protect, requireRole('admin'), async (req, res, next) => {
  try {
    const item = await Content.create(req.body)
    res.status(201).json(item)
  } catch (err) {
    next(err)
  }
})

// PUT /api/content/:id — admin only
router.put('/:id', protect, requireRole('admin'), async (req, res, next) => {
  try {
    const item = await Content.findByIdAndUpdate(req.params.id, req.body, {
      new: true, runValidators: true,
    })
    if (!item) return res.status(404).json({ message: 'Content not found' })
    res.json(item)
  } catch (err) {
    next(err)
  }
})

module.exports = router
