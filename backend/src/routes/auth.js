const router = require('express').Router()
const jwt = require('jsonwebtoken')
const { body, validationResult } = require('express-validator')
const User = require('../models/User')

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  })

// POST /api/auth/login
router.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }),
  ],
  async (req, res, next) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg })
    }

    try {
      const { email, password } = req.body
      const user = await User.findOne({ email, active: true })
      if (!user || !(await user.comparePassword(password))) {
        return res.status(401).json({ message: 'Invalid email or password' })
      }

      res.json({ token: signToken(user._id), user: user.toSafeObject() })
    } catch (err) {
      next(err)
    }
  }
)

// POST /api/auth/register
router.post(
  '/register',
  [
    body('username').trim().isLength({ min: 2, max: 50 }),
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  ],
  async (req, res, next) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg })
    }

    try {
      const { username, email, password } = req.body
      const user = await User.create({ username, email, passwordHash: password })
      res.status(201).json({ token: signToken(user._id), user: user.toSafeObject() })
    } catch (err) {
      next(err)
    }
  }
)

module.exports = router
