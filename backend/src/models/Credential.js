const mongoose = require('mongoose')

const credentialSchema = new mongoose.Schema({
  clusterName:   { type: String, required: true, trim: true },
  dashboardUrl:  { type: String, required: true, trim: true },
  kubeconfigYaml: { type: String, default: '' },
  description:   { type: String, default: '', trim: true },
  active:        { type: Boolean, default: true },
  assignedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
}, { timestamps: true })

credentialSchema.methods.toSafeObject = function () {
  const { _id, clusterName, dashboardUrl, description, active, assignedUsers, createdAt } = this
  return { _id, clusterName, dashboardUrl, description, active, assignedUsers, createdAt }
}

module.exports = mongoose.model('Credential', credentialSchema)
