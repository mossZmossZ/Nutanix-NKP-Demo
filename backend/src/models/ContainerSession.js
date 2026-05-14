const mongoose = require('mongoose')
const { encrypt, decrypt } = require('../lib/crypto')

const schema = new mongoose.Schema({
  userId:            { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  containerName:     { type: String, required: true, unique: true },
  containerId:       { type: String, default: null },
  slot:              { type: Number, required: true, unique: true },
  sshPort:           { type: Number, required: true },
  codeServerPort:    { type: Number, required: true },
  appPort:           { type: Number, default: null },
  encryptedPassword: { type: String, required: true },
  status: {
    type: String,
    enum: ['provisioning', 'running', 'stopped', 'error'],
    default: 'provisioning',
  },
}, { timestamps: true })

schema.methods.getPassword = function () {
  return decrypt(this.encryptedPassword)
}

module.exports = mongoose.model('ContainerSession', schema)
