const mongoose = require('mongoose')

const workshopCredentialSchema = new mongoose.Schema({
  workshopId: { type: mongoose.Schema.Types.ObjectId, ref: 'Workshop', required: true },
  userId:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  isGlobal:   { type: Boolean, default: false },
  fields: [{
    name:  { type: String, required: true },
    value: { type: String, default: '' },
    _id:   false,
  }],
}, { timestamps: true })

// Unique per (workshopId, userId) — null userId means global, so only one global per workshop
workshopCredentialSchema.index({ workshopId: 1, userId: 1 }, { unique: true })

module.exports = mongoose.model('WorkshopCredential', workshopCredentialSchema)
