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
    body('username').trim().notEmpty().withMessage('Username is required'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  async (req, res, next) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg })
    }

    try {
      const { username, password } = req.body

      // Fetch with +encryptedDisplayPassword so we can check and backfill if missing
      const user = await User.findOne({ username, active: true }).select('+encryptedDisplayPassword')
      if (!user || !(await user.comparePassword(password))) {
        return res.status(401).json({ message: 'Invalid username or password' })
      }

      // Backfill encryptedDisplayPassword for any user who pre-dates this feature.
      // We have the plain-text password here, so the pre-save hook will AES-encrypt
      // and re-bcrypt it automatically — the user's password stays the same.
      if (!user.encryptedDisplayPassword) {
        user.passwordHash = password
        await user.save()
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
    body('username').trim().isLength({ min: 2, max: 50 }).withMessage('Username must be 2–50 characters'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  ],
  async (req, res, next) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg })
    }

    try {
      const { username, password } = req.body
      const user = await User.create({ username, passwordHash: password })
      res.status(201).json({ token: signToken(user._id), user: user.toSafeObject() })
    } catch (err) {
      next(err)
    }
  }
)

module.exports = router
