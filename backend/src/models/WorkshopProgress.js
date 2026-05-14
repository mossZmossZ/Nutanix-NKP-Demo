const mongoose = require('mongoose')

const workshopProgressSchema = new mongoose.Schema({
  userId:         { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  workshopId:     { type: mongoose.Schema.Types.ObjectId, ref: 'Workshop', required: true },
  completedPages: [{ type: mongoose.Schema.Types.ObjectId, ref: 'WorkshopPage' }],
}, { timestamps: true })

workshopProgressSchema.index({ userId: 1, workshopId: 1 }, { unique: true })

module.exports = mongoose.model('WorkshopProgress', workshopProgressSchema)
