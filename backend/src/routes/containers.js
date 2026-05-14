const router   = require('express').Router()
const path     = require('path')
const crypto   = require('crypto')
const os       = require('os')
const tar      = require('tar-fs')
const { protect, requireRole } = require('../middleware/auth')
const ContainerSession = require('../models/ContainerSession')
const User     = require('../models/User')
const docker   = require('../lib/docker')
const { encrypt } = require('../lib/crypto')

const adminOnly  = [protect, requireRole('admin')]
const IMAGE_NAME = 'nutanix-lab:latest'
const DOCKER_DIR = path.resolve(__dirname, '../../../docker')

// In-memory build state (ephemeral — resets on backend restart; image existence is source of truth)
let buildState = { status: 'idle', log: [] }

const getHostIP = () => {
  if (process.env.HOST_IP) return process.env.HOST_IP
  const ifaces = os.networkInterfaces()
  for (const iface of Object.values(ifaces)) {
    for (const alias of iface) {
      if (alias.family === 'IPv4' && !alias.internal) return alias.address
    }
  }
  return 'localhost'
}

const generatePassword = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
  const bytes = crypto.randomBytes(12)
  return Array.from({ length: 12 }, (_, i) => chars[bytes[i] % chars.length]).join('')
}

const getLiveStatus = async (session) => {
  if (!session.containerId) return 'stopped'
  try {
    const info = await docker.getContainer(session.containerId).inspect()
    return info.State.Running ? 'running' : 'stopped'
  } catch {
    return 'stopped'
  }
}

// ─── Build image ──────────────────────────────────────────────────────────────

router.post('/build-image', ...adminOnly, (req, res) => {
  if (buildState.status === 'building') {
    return res.status(409).json({ message: 'Build already in progress' })
  }

  buildState = { status: 'building', log: [] }

  const tarStream = tar.pack(DOCKER_DIR)
  docker.buildImage(tarStream, { dockerfile: 'Dockerfile.lab', t: IMAGE_NAME }, (err, stream) => {
    if (err) {
      buildState.status = 'error'
      buildState.log.push(`Build error: ${err.message}`)
      return
    }
    docker.modem.followProgress(stream,
      (err) => {
        buildState.status = err ? 'error' : 'built'
        if (err) buildState.log.push(`Build failed: ${err.message}`)
      },
      (event) => {
        if (event.stream) buildState.log.push(event.stream)
        if (event.error) buildState.log.push(`Error: ${event.error}`)
      }
    )
  })

  res.json({ message: 'Build started' })
})

router.get('/build-status', ...adminOnly, async (req, res, next) => {
  try {
    if (buildState.status === 'idle' || buildState.status === 'built') {
      try {
        await docker.getImage(IMAGE_NAME).inspect()
        buildState.status = 'built'
      } catch {
        buildState.status = 'idle'
      }
    }
    res.json({ status: buildState.status, log: buildState.log.slice(-100) })
  } catch (err) { next(err) }
})

// ─── List all containers ──────────────────────────────────────────────────────

router.get('/', ...adminOnly, async (req, res, next) => {
  try {
    const [users, sessions] = await Promise.all([
      User.find({ role: { $ne: 'admin' } }).select('username').sort('username'),
      ContainerSession.find(),
    ])

    // Sync live Docker status to DB
    for (const s of sessions) {
      if (s.status === 'provisioning') continue
      const live = await getLiveStatus(s)
      if (s.status !== live) { s.status = live; await s.save() }
    }

    const sessionByUser = Object.fromEntries(sessions.map(s => [s.userId.toString(), s]))

    const containers = users.map(u => {
      const s = sessionByUser[u._id.toString()]
      return {
        user: { _id: u._id, username: u.username },
        session: s ? {
          _id:            s._id,
          containerName:  s.containerName,
          slot:           s.slot,
          sshPort:        s.sshPort,
          codeServerPort: s.codeServerPort,
          appPort:        s.appPort,
          status:         s.status,
          password:       s.getPassword(),
          createdAt:      s.createdAt,
        } : null,
      }
    })

    res.json({ hostIP: getHostIP(), containers })
  } catch (err) { next(err) }
})

// ─── Provision ────────────────────────────────────────────────────────────────

router.post('/:userId/provision', ...adminOnly, async (req, res, next) => {
  try {
    const user = await User.findById(req.params.userId)
    if (!user) return res.status(404).json({ message: 'User not found' })

    if (await ContainerSession.findOne({ userId: user._id })) {
      return res.status(409).json({ message: 'Container already provisioned for this user' })
    }

    try {
      await docker.getImage(IMAGE_NAME).inspect()
    } catch {
      return res.status(400).json({ message: 'Lab image not built yet. Click "Build Image" first.' })
    }

    // Lowest available slot
    const usedSlots = (await ContainerSession.find().select('slot')).map(s => s.slot)
    let slot = 1
    while (usedSlots.includes(slot)) slot++

    const password      = generatePassword()
    const containerName = `lab-${user.username}`

    const session = await ContainerSession.create({
      userId:            user._id,
      containerName,
      slot,
      sshPort:           30000 + slot,
      codeServerPort:    31000 + slot,
      appPort:           32000 + slot,
      encryptedPassword: encrypt(password),
      status:            'provisioning',
    })

    try {
      const container = await docker.createContainer({
        name:  containerName,
        Image: IMAGE_NAME,
        Env:   [`USER_PASSWORD=${password}`],
        ExposedPorts: {
          '22/tcp': {},
          '8080/tcp': {},
          [`${session.appPort}/tcp`]: {},
        },
        HostConfig: {
          PortBindings: {
            '22/tcp':                       [{ HostPort: String(session.sshPort) }],
            '8080/tcp':                     [{ HostPort: String(session.codeServerPort) }],
            [`${session.appPort}/tcp`]:     [{ HostPort: String(session.appPort) }],
          },
          Privileged: true,
        },
      })

      session.containerId = container.id
      await container.start()
      session.status = 'running'
      await session.save()
    } catch (dockerErr) {
      session.status = 'error'
      await session.save()
      throw dockerErr
    }

    res.status(201).json({
      hostIP: getHostIP(),
      session: {
        _id:            session._id,
        containerName:  session.containerName,
        slot:           session.slot,
        sshPort:        session.sshPort,
        codeServerPort: session.codeServerPort,
        appPort:        session.appPort,
        status:         session.status,
        password,
      },
    })
  } catch (err) { next(err) }
})

// ─── Start ────────────────────────────────────────────────────────────────────

router.post('/:userId/start', ...adminOnly, async (req, res, next) => {
  try {
    const session = await ContainerSession.findOne({ userId: req.params.userId })
    if (!session)              return res.status(404).json({ message: 'No container for this user' })
    if (!session.containerId)  return res.status(400).json({ message: 'Container not provisioned' })

    await docker.getContainer(session.containerId).start()
    session.status = 'running'
    await session.save()
    res.json({ message: 'Container started' })
  } catch (err) { next(err) }
})

// ─── Stop ─────────────────────────────────────────────────────────────────────

router.post('/:userId/stop', ...adminOnly, async (req, res, next) => {
  try {
    const session = await ContainerSession.findOne({ userId: req.params.userId })
    if (!session)              return res.status(404).json({ message: 'No container for this user' })
    if (!session.containerId)  return res.status(400).json({ message: 'Container not provisioned' })

    try {
      await docker.getContainer(session.containerId).stop()
    } catch (e) {
      // 304 = already stopped, 404 = container gone — both are fine
      if (e.statusCode !== 304 && e.statusCode !== 404) throw e
    }
    session.status = 'stopped'
    await session.save()
    res.json({ message: 'Container stopped' })
  } catch (err) { next(err) }
})

// ─── Delete ───────────────────────────────────────────────────────────────────

router.delete('/:userId', ...adminOnly, async (req, res, next) => {
  try {
    const session = await ContainerSession.findOne({ userId: req.params.userId })
    if (!session) return res.status(404).json({ message: 'No container for this user' })

    if (session.containerId) {
      try {
        // force:true stops and removes in one call — works even if already stopped
        await docker.getContainer(session.containerId).remove({ force: true })
      } catch (e) {
        if (e.statusCode !== 404) throw e
      }
    }

    await session.deleteOne()
    res.json({ message: 'Container removed' })
  } catch (err) { next(err) }
})

module.exports = router
