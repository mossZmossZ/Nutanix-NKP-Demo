const router = require('express').Router()
const { protect, requirePortalAccess } = require('../middleware/auth')
const Credential = require('../models/Credential')
const User = require('../models/User')

const demoAccess = [protect, requirePortalAccess('demo')]

// GET /api/credentials
// Returns credentials assigned to the requesting user, with their own
// username and decrypted display password as the cluster login credentials.
router.get('/', ...demoAccess, async (req, res, next) => {
  try {
    const [creds, fullUser] = await Promise.all([
      Credential.find({ active: true, assignedUsers: req.user._id }).sort('clusterName'),
      User.findById(req.user._id).select('+encryptedDisplayPassword'),
    ])

    const displayPassword = fullUser?.getDisplayPassword() || ''

    const result = creds.map(c => ({
      ...c.toSafeObject(),
      username: req.user.username,
      password: displayPassword,
      hasKubeconfig: !!c.kubeconfigYaml,
    }))
    res.json(result)
  } catch (err) { next(err) }
})

// GET /api/credentials/:id/kubeconfig
router.get('/:id/kubeconfig', protect, async (req, res, next) => {
  try {
    const isAdmin = req.user.role === 'admin'
    const query = isAdmin
      ? { _id: req.params.id }
      : { _id: req.params.id, assignedUsers: req.user._id, active: true }

    const cred = await Credential.findOne(query)
    if (!cred) return res.status(404).json({ message: 'Credential not found' })
    if (!cred.kubeconfigYaml) return res.status(404).json({ message: 'No kubeconfig available for this cluster' })

    const filename = `${cred.clusterName.replace(/\s+/g, '-').toLowerCase()}-kubeconfig.yaml`
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
    res.setHeader('Content-Type', 'application/x-yaml')
    res.send(cred.kubeconfigYaml)
  } catch (err) { next(err) }
})

module.exports = router
