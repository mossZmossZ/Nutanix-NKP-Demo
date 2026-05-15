import { useState, useEffect, useRef } from 'react'
import {
  Terminal, Code2, RefreshCw, Hammer, Play, Square, Trash2,
  Eye, EyeOff, Copy, ExternalLink, Package,
  CheckCircle, AlertCircle, Loader2, Info, Globe, ChevronDown,
} from 'lucide-react'
import api from '@/lib/api'
import { toastSuccess, toastError, confirmDelete } from '@/lib/swal'

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusBadge({ status }) {
  const styles = {
    running:      'bg-emerald-50 text-emerald-700 border-emerald-200',
    stopped:      'bg-gray-50    text-gray-500    border-gray-200',
    provisioning: 'bg-amber-50   text-amber-700   border-amber-200',
    error:        'bg-red-50     text-red-700     border-red-200',
  }
  const dots = {
    running:      'bg-emerald-500',
    stopped:      'bg-gray-400',
    provisioning: 'bg-amber-400 animate-pulse',
    error:        'bg-red-500',
  }
  const labels = {
    running: 'Running', stopped: 'Stopped', provisioning: 'Provisioning', error: 'Error',
  }
  const s = styles[status] || 'bg-gray-50 text-gray-400 border-gray-200'
  const d = dots[status]   || 'bg-gray-300'
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border ${s}`}>
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${d}`} />
      {labels[status] || 'Not provisioned'}
    </span>
  )
}

function CopyBtn({ value }) {
  const copy = () =>
    navigator.clipboard.writeText(value).then(() => toastSuccess('Copied!'))
  return (
    <button onClick={copy} className="p-0.5 text-gray-400 hover:text-nutanix-600 transition-colors rounded shrink-0" title="Copy">
      <Copy size={12} />
    </button>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function ContainerLabs() {
  const [hostIP,      setHostIP]      = useState('')
  const [containers,  setContainers]  = useState([])
  const [buildStatus, setBuildStatus] = useState('idle')
  const [buildLog,    setBuildLog]    = useState([])
  const [showLog,        setShowLog]        = useState(false)
  const [showAccessHelp, setShowAccessHelp] = useState(false)
  const [pageLoading,    setPageLoading]    = useState(true)
  const [syncing,     setSyncing]     = useState(false)
  const [actionBusy,  setActionBusy]  = useState({})
  const [revealed,    setRevealed]    = useState({})
  const pollRef = useRef(null)

  // ── Data fetchers ──────────────────────────────────────────────────────────

  const fetchContainers = async () => {
    const r = await api.get('/admin/containers')
    setHostIP(r.data.hostIP)
    setContainers(r.data.containers)
  }

  const fetchBuildStatus = async () => {
    const r = await api.get('/admin/containers/build-status')
    setBuildStatus(r.data.status)
    setBuildLog(r.data.log || [])
    return r.data
  }

  useEffect(() => {
    Promise.all([
      fetchContainers().catch(() => {}),
      fetchBuildStatus().catch(() => {}),
    ]).finally(() => setPageLoading(false))
  }, [])

  // Poll while building
  useEffect(() => {
    if (buildStatus !== 'building') return
    pollRef.current = setInterval(async () => {
      const d = await fetchBuildStatus().catch(() => null)
      if (d && d.status !== 'building') {
        clearInterval(pollRef.current)
        if (d.status === 'built') toastSuccess('Image built successfully!')
        else if (d.status === 'error') toastError('Build failed — check the log below.')
      }
    }, 3000)
    return () => clearInterval(pollRef.current)
  }, [buildStatus])

  // ── Actions ────────────────────────────────────────────────────────────────

  const withBusy = async (userId, fn) => {
    setActionBusy(p => ({ ...p, [userId]: true }))
    try { await fn() } finally { setActionBusy(p => ({ ...p, [userId]: false })) }
  }

  const handleBuild = async () => {
    try {
      await api.post('/admin/containers/build-image')
      setBuildStatus('building')
      setShowLog(true)
    } catch (err) {
      toastError(err.response?.data?.message || 'Failed to start build')
    }
  }

  const handleSync = async () => {
    setSyncing(true)
    await fetchContainers().catch(() => {})
    setSyncing(false)
  }

  const handleProvision = (userId) =>
    withBusy(userId, async () => {
      await api.post(`/admin/containers/${userId}/provision`)
      toastSuccess('Container provisioned!')
      await fetchContainers()
    }).catch(err => toastError(err.response?.data?.message || 'Failed to provision'))

  const handleStart = (userId) =>
    withBusy(userId, async () => {
      await api.post(`/admin/containers/${userId}/start`)
      toastSuccess('Container started')
      await fetchContainers()
    }).catch(err => toastError(err.response?.data?.message || 'Failed to start container'))

  const handleStop = (userId) =>
    withBusy(userId, async () => {
      await api.post(`/admin/containers/${userId}/stop`)
      toastSuccess('Container stopped')
      await fetchContainers()
    }).catch(err => toastError(err.response?.data?.message || 'Failed to stop container'))

  const handleDelete = async (userId, username) => {
    const result = await confirmDelete(`container for "${username}"`)
    if (!result.isConfirmed) return
    withBusy(userId, async () => {
      await api.delete(`/admin/containers/${userId}`)
      toastSuccess('Container removed')
      await fetchContainers()
    }).catch(err => toastError(err.response?.data?.message || 'Failed to remove container'))
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  if (pageLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-gray-100 rounded animate-pulse w-48" />
        <div className="h-12 bg-gray-100 rounded-xl animate-pulse" />
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />
        ))}
      </div>
    )
  }

  const imageReady = buildStatus === 'built'

  return (
    <div className="w-full space-y-5">

      {/* Header */}
      <div className="flex items-start gap-3 flex-wrap">
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-bold text-gray-900">Container Labs</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Provision isolated lab environments with code-server, Docker, and kubectl.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleSync}
            disabled={syncing}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            <RefreshCw size={14} className={syncing ? 'animate-spin' : ''} />
            Sync
          </button>
          <button
            onClick={handleBuild}
            disabled={buildStatus === 'building'}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-nutanix-700 rounded-lg hover:bg-nutanix-800 disabled:opacity-50 transition-colors"
          >
            {buildStatus === 'building'
              ? <Loader2 size={14} className="animate-spin" />
              : <Hammer size={14} />}
            {buildStatus === 'building' ? 'Building…' : 'Build Image'}
          </button>
        </div>
      </div>

      {/* Image status banner */}
      <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-medium ${
        imageReady           ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
        : buildStatus === 'building' ? 'bg-amber-50   border-amber-200   text-amber-800'
        : buildStatus === 'error'    ? 'bg-red-50     border-red-200     text-red-800'
        :                              'bg-gray-50    border-gray-200    text-gray-500'
      }`}>
        {imageReady
          ? <CheckCircle size={16} className="text-emerald-600 shrink-0" />
          : buildStatus === 'error'
          ? <AlertCircle size={16} className="text-red-500 shrink-0" />
          : buildStatus === 'building'
          ? <Loader2 size={16} className="animate-spin shrink-0" />
          : <Package size={16} className="text-gray-400 shrink-0" />}

        <span>
          {imageReady
            ? 'nutanix-lab:latest is ready'
            : buildStatus === 'building'
            ? 'Building nutanix-lab:latest — this takes 5–10 min on first run…'
            : buildStatus === 'error'
            ? 'Build failed — expand the log below and retry'
            : 'Image not built yet — click "Build Image" to get started'}
        </span>

        {buildLog.length > 0 && (
          <button
            onClick={() => setShowLog(v => !v)}
            className="ml-auto text-xs font-normal underline opacity-60 hover:opacity-100 shrink-0"
          >
            {showLog ? 'Hide log' : 'Show log'}
          </button>
        )}
      </div>

      {/* Build log */}
      {showLog && buildLog.length > 0 && (
        <div className="bg-gray-900 rounded-xl p-4 text-xs text-gray-300 font-mono max-h-52 overflow-y-auto leading-relaxed whitespace-pre-wrap">
          {buildLog.join('')}
        </div>
      )}

      {/* Access Methods Guide */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <button
          onClick={() => setShowAccessHelp(v => !v)}
          className="w-full flex items-center gap-2 px-4 py-3 text-left hover:bg-gray-50 transition-colors"
        >
          <Info size={14} className="text-nutanix-600 shrink-0" />
          <span className="text-sm font-semibold text-gray-900">Access Methods Guide</span>
          <span className="ml-2 text-xs text-gray-400 font-normal hidden sm:inline">
            App Port · code-server Proxy · SSH Tunnel
          </span>
          <ChevronDown
            size={14}
            className={`ml-auto text-gray-400 transition-transform duration-200 shrink-0 ${showAccessHelp ? 'rotate-180' : ''}`}
          />
        </button>

        {showAccessHelp && (
          <div className="border-t border-gray-50 px-4 pb-5 grid grid-cols-1 md:grid-cols-3 gap-5 pt-4">

            {/* Method 1 — App Port */}
            <div>
              <div className="flex items-center gap-1.5 mb-1.5">
                <Globe size={13} className="text-sky-600 shrink-0" />
                <span className="text-xs font-semibold text-gray-800">App Port — Direct access</span>
              </div>
              <p className="text-xs text-gray-500 mb-2 leading-relaxed">
                Map your workload to the user's dedicated app port. The host forwards it directly.
              </p>
              <div className="bg-gray-900 rounded-lg px-3 py-2 font-mono text-xs text-green-400 leading-relaxed">
                <span className="text-gray-500"># inside DinD</span>{'\n'}
                docker run -p {'<appPort>'}:80 nginx{'\n'}
                {'\n'}
                <span className="text-gray-500"># accessible at</span>{'\n'}
                http://{'<host>'}:{'<appPort>'}
              </div>
            </div>

            {/* Method 2 — code-server Proxy */}
            <div>
              <div className="flex items-center gap-1.5 mb-1.5">
                <Code2 size={13} className="text-violet-600 shrink-0" />
                <span className="text-xs font-semibold text-gray-800">code-server Proxy</span>
              </div>
              <p className="text-xs text-gray-500 mb-2 leading-relaxed">
                Access any port through code-server's built-in proxy. No extra port needed.
              </p>
              <div className="bg-gray-900 rounded-lg px-3 py-2 font-mono text-xs text-green-400 leading-relaxed">
                <span className="text-gray-500"># inside DinD (any port)</span>{'\n'}
                docker run -p 9000:80 nginx{'\n'}
                {'\n'}
                <span className="text-gray-500"># accessible via proxy</span>{'\n'}
                http://{'<host>'}:{'<csPort>'}/proxy/9000/
              </div>
            </div>

            {/* Method 3 — SSH Tunnel */}
            <div>
              <div className="flex items-center gap-1.5 mb-1.5">
                <Terminal size={13} className="text-emerald-600 shrink-0" />
                <span className="text-xs font-semibold text-gray-800">SSH Tunnel — Local forward</span>
              </div>
              <p className="text-xs text-gray-500 mb-2 leading-relaxed">
                Forward any port to your local machine over the SSH connection.
              </p>
              <div className="bg-gray-900 rounded-lg px-3 py-2 font-mono text-xs text-green-400 leading-relaxed">
                <span className="text-gray-500"># on your local machine</span>{'\n'}
                ssh -L 8080:localhost:{'<port>'}{'\n'}
                {'    '}user@{'<host>'} -p {'<sshPort>'}{'\n'}
                {'\n'}
                <span className="text-gray-500"># then open locally</span>{'\n'}
                http://localhost:8080
              </div>
            </div>

          </div>
        )}
      </div>

      {/* Container table */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-50 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900">
            User Containers
          </h3>
          <span className="text-xs text-gray-400">
            Host: <span className="font-mono text-gray-600">{hostIP}</span>
            <span className="mx-2 text-gray-200">·</span>
            {containers.length} users
          </span>
        </div>

        {containers.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-gray-400">
            No users found. Create users in the Users section first.
          </p>
        ) : (
          <div className="divide-y divide-gray-50">
            {containers.map(({ user, session }) => {
              const busy      = actionBusy[user._id]
              const status    = session?.status || 'none'
              const isNone    = !session
              const isStopped = status === 'stopped'
              const isRunning = status === 'running'

              return (
                <div key={user._id} className="px-4 py-4">

                  {/* ── Row header: avatar + name + status + actions ── */}
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-nutanix-100 flex items-center justify-center shrink-0">
                      <span className="text-nutanix-700 text-xs font-bold">
                        {user.username[0].toUpperCase()}
                      </span>
                    </div>

                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate leading-none mb-1">
                        {user.username}
                      </p>
                      <StatusBadge status={status} />
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1.5 ml-auto shrink-0">
                      {busy ? (
                        <Loader2 size={16} className="text-nutanix-500 animate-spin" />
                      ) : (
                        <>
                          {isNone && (
                            <button
                              onClick={() => handleProvision(user._id)}
                              disabled={!imageReady}
                              title={imageReady ? 'Provision container' : 'Build the image first'}
                              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-white bg-nutanix-600 rounded-lg hover:bg-nutanix-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                            >
                              <Package size={12} />
                              Provision
                            </button>
                          )}
                          {isStopped && (
                            <button
                              onClick={() => handleStart(user._id)}
                              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors"
                            >
                              <Play size={12} />
                              Start
                            </button>
                          )}
                          {isRunning && (
                            <button
                              onClick={() => handleStop(user._id)}
                              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-lg hover:bg-amber-100 transition-colors"
                            >
                              <Square size={12} />
                              Stop
                            </button>
                          )}
                          {session && (
                            <button
                              onClick={() => handleDelete(user._id, user.username)}
                              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Remove container"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  {/* ── Port detail card ── */}
                  {session ? (
                    <div className="mt-3 ml-10 rounded-xl border border-gray-100 overflow-hidden divide-y divide-gray-50 text-xs">

                      {/* SSH */}
                      <div className="flex items-center gap-3 px-3 py-2.5">
                        <div className="flex items-center gap-1.5 w-24 shrink-0">
                          <Terminal size={11} className="text-emerald-600 shrink-0" />
                          <span className="font-semibold text-emerald-700">SSH</span>
                          <span className="font-mono text-gray-400 ml-auto">:{session.sshPort}</span>
                        </div>
                        <code className="font-mono text-gray-700 flex-1 min-w-0 truncate">
                          ssh user@{hostIP} -p {session.sshPort}
                        </code>
                        <CopyBtn value={`ssh user@${hostIP} -p ${session.sshPort}`} />
                      </div>

                      {/* VS Code (code-server) — via nginx proxy on port 8080 */}
                      {(() => {
                        const vsUrl = `http://${hostIP}:8080/lab/slot${session.slot}/`
                        return (
                          <div className="flex items-center gap-3 px-3 py-2.5">
                            <div className="flex items-center gap-1.5 w-24 shrink-0">
                              <Code2 size={11} className="text-nutanix-600 shrink-0" />
                              <span className="font-semibold text-nutanix-700">VS Code</span>
                              <span className="font-mono text-gray-400 ml-auto">slot{session.slot}</span>
                            </div>
                            <a
                              href={vsUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="font-mono text-nutanix-600 hover:underline flex-1 min-w-0 truncate"
                            >
                              {vsUrl}
                            </a>
                            <ExternalLink size={11} className="text-gray-300 shrink-0" />
                            <CopyBtn value={vsUrl} />
                          </div>
                        )
                      })()}

                      {/* App Port — always shown; computed from slot when not yet mapped */}
                      {(() => {
                        const port   = session.appPort || (32000 + session.slot)
                        const active = !!session.appPort
                        return (
                          <div className={`flex items-start gap-3 px-3 py-2.5 ${active ? 'bg-sky-50/40' : 'bg-gray-50/60'}`}>
                            <div className="flex items-center gap-1.5 w-24 shrink-0 pt-0.5">
                              <Globe size={11} className={active ? 'text-sky-600 shrink-0' : 'text-gray-400 shrink-0'} />
                              <span className={`font-semibold ${active ? 'text-sky-700' : 'text-gray-500'}`}>App Port</span>
                              <span className="font-mono text-gray-400 ml-auto">:{port}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              {active ? (
                                <>
                                  <a
                                    href={`http://${hostIP}:${port}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="font-mono text-sky-600 hover:underline block truncate"
                                  >
                                    http://{hostIP}:{port}
                                  </a>
                                  <p className="text-gray-400 font-mono mt-0.5">
                                    Run inside container:{' '}
                                    <span className="text-gray-600">docker run -p {port}:80 &lt;image&gt;</span>
                                  </p>
                                </>
                              ) : (
                                <>
                                  <p className="font-mono text-gray-400 truncate">http://{hostIP}:{port}</p>
                                  <p className="text-amber-600 mt-0.5 font-medium">
                                    Port not mapped — delete and re-provision this container to activate.
                                  </p>
                                </>
                              )}
                            </div>
                            {active && (
                              <>
                                <ExternalLink size={11} className="text-gray-300 shrink-0 mt-0.5" />
                                <CopyBtn value={`http://${hostIP}:${port}`} />
                              </>
                            )}
                          </div>
                        )
                      })()}

                      {/* Password */}
                      <div className="flex items-center gap-3 px-3 py-2.5 bg-gray-50/60">
                        <div className="flex items-center gap-1.5 w-24 shrink-0">
                          <Eye size={11} className="text-gray-400 shrink-0" />
                          <span className="font-semibold text-gray-600">Password</span>
                        </div>
                        <span className="text-gray-500 font-mono shrink-0">user /</span>
                        <code className="font-mono text-gray-800 flex-1 min-w-0">
                          {revealed[session._id] ? session.password : '••••••••••••'}
                        </code>
                        <button
                          onClick={() => setRevealed(r => ({ ...r, [session._id]: !r[session._id] }))}
                          className="p-0.5 text-gray-400 hover:text-nutanix-600 transition-colors rounded shrink-0"
                          title={revealed[session._id] ? 'Hide' : 'Reveal'}
                        >
                          {revealed[session._id] ? <EyeOff size={13} /> : <Eye size={13} />}
                        </button>
                        <CopyBtn value={session.password} />
                      </div>

                    </div>
                  ) : (
                    <p className="mt-2 ml-10 text-xs text-gray-400 italic">
                      No container provisioned yet — click Provision to create one.
                    </p>
                  )}

                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
