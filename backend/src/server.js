require('dotenv').config()
const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const morgan = require('morgan')
const rateLimit = require('express-rate-limit')
const connectDB = require('./config/database')
const seedAdmin = require('./utils/seedAdmin')

const app = express()

// Trust the Nginx reverse proxy (needed for rate-limit X-Forwarded-For)
app.set('trust proxy', 1)

// Connect DB then seed admin
connectDB().then(seedAdmin)

// Security middleware
app.use(helmet())
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
}))

// Rate limiting on auth routes
app.use('/api/auth', rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { message: 'Too many requests, please try again later.' },
}))

app.use(express.json({ limit: '2mb' })) // 2mb for kubeconfig YAML
app.use(express.urlencoded({ extended: false }))

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'))
}

// Routes
app.use('/api/auth',              require('./routes/auth'))
app.use('/api/users',             require('./routes/users'))
app.use('/api/content',           require('./routes/content'))
app.use('/api/admin/containers',  require('./routes/containers'))
app.use('/api/admin',             require('./routes/admin'))
app.use('/api/credentials',       require('./routes/credentials'))
app.use('/api/workshop',          require('./routes/workshop'))

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', env: process.env.NODE_ENV })
})

// 404
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' })
})

// Error handler
app.use(require('./middleware/errorHandler'))

const PORT = process.env.PORT || 5000
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT} [${process.env.NODE_ENV}]`)
})

module.exports = app
