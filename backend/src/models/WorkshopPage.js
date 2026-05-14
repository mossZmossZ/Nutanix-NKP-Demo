const mongoose = require('mongoose')

const workshopPageSchema = new mongoose.Schema({
  workshopId: { type: mongoose.Schema.Types.ObjectId, ref: 'Workshop', required: true, index: true },
  title:      { type: String, required: true, trim: true },
  content:    { type: String, default: '' },
  order:      { type: Number, default: 0 },
  published:  { type: Boolean, default: true },
}, { timestamps: true })

module.exports = mongoose.model('WorkshopPage', workshopPageSchema)
