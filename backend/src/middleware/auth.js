const jwt = require('jsonwebtoken')
const User = require('../models/User')

const protect = async (req, res, next) => {
  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Not authenticated' })
  }

  const token = authHeader.split(' ')[1]
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    const user = await User.findById(decoded.id).select('-passwordHash')
    if (!user || !user.active) {
      return res.status(401).json({ message: 'User not found or inactive' })
    }
    req.user = user
    next()
  } catch {
    res.status(401).json({ message: 'Invalid or expired token' })
  }
}

const requireRole = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user?.role)) {
    return res.status(403).json({ message: 'Insufficient permissions' })
  }
  next()
}

const requirePortalAccess = (portal) => (req, res, next) => {
  if (req.user?.role === 'admin' || req.user?.portalAccess?.includes(portal)) {
    return next()
  }
  res.status(403).json({ message: `No access to ${portal} portal` })
}

module.exports = { protect, requireRole, requirePortalAccess }
