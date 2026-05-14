const router = require('express').Router()
const { protect } = require('../middleware/auth')
const Workshop         = require('../models/Workshop')
const WorkshopPage     = require('../models/WorkshopPage')
const WorkshopCred     = require('../models/WorkshopCredential')
const WorkshopProgress = require('../models/WorkshopProgress')

const wsAccess = [protect, (req, res, next) => {
  if (req.user.role !== 'admin' && !req.user.portalAccess.includes('workshop')) {
    return res.status(403).json({ message: 'Workshop access required' })
  }
  next()
}]

// List accessible workshops with totalPages count
router.get('/', ...wsAccess, async (req, res, next) => {
  try {
    const query = req.user.role === 'admin'
      ? { active: true }
      : { active: true, $or: [{ assignedUsers: req.user._id }, { assignedUsers: { $size: 0 } }] }

    const workshops = await Workshop.find(query).sort('-createdAt')

    const pageCounts = await WorkshopPage.aggregate([
      { $match: { workshopId: { $in: workshops.map(w => w._id) }, published: true } },
      { $group: { _id: '$workshopId', count: { $sum: 1 } } },
    ])
    const countMap = Object.fromEntries(pageCounts.map(p => [p._id.toString(), p.count]))

    res.json(workshops.map(w => ({ ...w.toObject(), totalPages: countMap[w._id.toString()] || 0 })))
  } catch (err) { next(err) }
})

// Progress summary for all workshops — MUST be before /:id
router.get('/my-progress', ...wsAccess, async (req, res, next) => {
  try {
    const progresses = await WorkshopProgress.find({ userId: req.user._id })
    const result = {}
    progresses.forEach(p => { result[p.workshopId.toString()] = p.completedPages.length })
    res.json(result)
  } catch (err) { next(err) }
})

// Workshop detail + published page list (titles only, content loaded lazily)
router.get('/:id', ...wsAccess, async (req, res, next) => {
  try {
    const workshop = await Workshop.findOne({ _id: req.params.id, active: true })
    if (!workshop) return res.status(404).json({ message: 'Workshop not found' })
    const pages = await WorkshopPage.find({ workshopId: req.params.id, published: true })
      .sort('order').select('title order _id')
    res.json({ ...workshop.toObject(), pages })
  } catch (err) { next(err) }
})

// Single page content (lazy loaded on step selection)
router.get('/:id/pages/:pageId', ...wsAccess, async (req, res, next) => {
  try {
    const page = await WorkshopPage.findOne({
      _id: req.params.pageId, workshopId: req.params.id, published: true,
    })
    if (!page) return res.status(404).json({ message: 'Page not found' })
    res.json(page)
  } catch (err) { next(err) }
})

// User's credentials for this workshop — per-user first, then fall back to global
router.get('/:id/my-credentials', ...wsAccess, async (req, res, next) => {
  try {
    let cred = await WorkshopCred.findOne({ workshopId: req.params.id, userId: req.user._id })
    if (!cred) cred = await WorkshopCred.findOne({ workshopId: req.params.id, isGlobal: true })
    res.json(cred || null)
  } catch (err) { next(err) }
})

// Progress for a specific workshop
router.get('/:id/progress', ...wsAccess, async (req, res, next) => {
  try {
    const progress = await WorkshopProgress.findOne({ userId: req.user._id, workshopId: req.params.id })
    res.json(progress || { completedPages: [] })
  } catch (err) { next(err) }
})

// Mark / unmark a page as complete
router.post('/:id/progress', ...wsAccess, async (req, res, next) => {
  try {
    const { pageId, completed } = req.body
    const update = completed
      ? { $addToSet: { completedPages: pageId } }
      : { $pull: { completedPages: pageId } }
    const progress = await WorkshopProgress.findOneAndUpdate(
      { userId: req.user._id, workshopId: req.params.id },
      update,
      { upsert: true, new: true }
    )
    res.json(progress)
  } catch (err) { next(err) }
})

module.exports = router
