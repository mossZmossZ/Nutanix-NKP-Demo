const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')
const { encrypt, decrypt } = require('../lib/crypto')

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 2,
    maxlength: 50,
  },
  passwordHash: {
    type: String,
    required: true,
  },
  // AES-encrypted copy of the plain-text password — used to display credentials on Demo Portal.
  // select: false keeps it out of every query unless explicitly requested with +encryptedDisplayPassword.
  encryptedDisplayPassword: {
    type: String,
    select: false,
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
  // passwordHash holds the plain text at this point — encrypt it reversibly first,
  // then replace it with the bcrypt hash used for authentication.
  this.encryptedDisplayPassword = encrypt(this.passwordHash)
  this.passwordHash = await bcrypt.hash(this.passwordHash, 12)
  next()
})

userSchema.methods.comparePassword = function (password) {
  return bcrypt.compare(password, this.passwordHash)
}

userSchema.methods.getDisplayPassword = function () {
  if (!this.encryptedDisplayPassword) return ''
  return decrypt(this.encryptedDisplayPassword)
}

userSchema.methods.toSafeObject = function () {
  const { _id, username, role, portalAccess, createdAt } = this
  return { _id, username, role, portalAccess, createdAt }
}

module.exports = mongoose.model('User', userSchema)
