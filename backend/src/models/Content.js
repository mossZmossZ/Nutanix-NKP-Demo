const mongoose = require('mongoose')

const contentSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  slug: { type: String, required: true, unique: true, lowercase: true },
  type: {
    type: String,
    enum: ['guide', 'lab', 'documentation', 'yaml'],
    required: true,
  },
  portal: {
    type: String,
    enum: ['demo', 'workshop', 'installation', 'public'],
    required: true,
  },
  content: { type: String, default: '' },
  order: { type: Number, default: 0 },
  published: { type: Boolean, default: true },
}, { timestamps: true })

contentSchema.index({ portal: 1, type: 1, order: 1 })

module.exports = mongoose.model('Content', contentSchema)
