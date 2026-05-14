const mongoose = require('mongoose')

const fieldSchema = new mongoose.Schema({
  name:  { type: String, required: true, trim: true },
  label: { type: String, required: true, trim: true },
  type:  { type: String, enum: ['text', 'password', 'url'], default: 'text' },
}, { _id: false })

const workshopSchema = new mongoose.Schema({
  title:            { type: String, required: true, trim: true },
  description:      { type: String, default: '', trim: true },
  credentialFields: { type: [fieldSchema], default: [] },
  assignedUsers:    [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  active:           { type: Boolean, default: true },
}, { timestamps: true })

module.exports = mongoose.model('Workshop', workshopSchema)
