const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 50,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  passwordHash: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ['user', 'admin', 'instructor'],
    default: 'user',
  },
  portalAccess: {
    type: [String],
    enum: ['demo', 'workshop'],
    default: [],
  },
  active: {
    type: Boolean,
    default: true,
  },
}, { timestamps: true })

userSchema.pre('save', async function (next) {
  if (!this.isModified('passwordHash')) return next()
  this.passwordHash = await bcrypt.hash(this.passwordHash, 12)
  next()
})

userSchema.methods.comparePassword = function (password) {
  return bcrypt.compare(password, this.passwordHash)
}

userSchema.methods.toSafeObject = function () {
  const { _id, username, email, role, portalAccess, createdAt } = this
  return { _id, username, email, role, portalAccess, createdAt }
}

module.exports = mongoose.model('User', userSchema)
