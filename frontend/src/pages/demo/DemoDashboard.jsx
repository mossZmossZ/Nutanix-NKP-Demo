import { useEffect, useState } from 'react'
import { Server, Key, ExternalLink, Download, Eye, EyeOff, RefreshCw, Copy, Check } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import api from '@/lib/api'
import { toastSuccess, toastError } from '@/lib/swal'

export default function DemoDashboard() {
  const { user } = useAuth()
  const [creds, setCreds]     = useState([])
  const [loading, setLoading] = useState(true)
  const [revealed, setRevealed] = useState({})

  const load = () => {
    setLoading(true)
    api.get('/credentials')
      .then(r => setCreds(r.data))
      .catch(() => toastError('Failed to load credentials'))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  const toggleReveal = (id) => setRevealed(r => ({ ...r, [id]: !r[id] }))

  const handleDownload = async (cred) => {
    try {
      const res  = await api.get(`/credentials/${cred._id}/kubeconfig`, { responseType: 'blob' })
      const url  = URL.createObjectURL(new Blob([res.data]))
      const link = document.createElement('a')
      link.href  = url
      link.download = `${cred.clusterName.replace(/\s+/g, '-').toLowerCase()}-kubeconfig.yaml`
      link.click()
      URL.revokeObjectURL(url)
      toastSuccess('Kubeconfig downloaded')
    } catch {
      toastError('No kubeconfig available for this cluster')
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">

      {/* ── Page header ────────────────────────────── */}
      <div className="flex items-center justify-between mb-8 pb-6 border-b border-gray-200">
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 bg-card-gradient rounded-xl flex items-center justify-center shrink-0">
            <Server size={22} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Demo Portal</h1>
            <p className="text-gray-500 text-sm mt-0.5">
              Welcome, <span className="font-medium text-nutanix-700">{user?.username}</span>
            </p>
          </div>
        </div>
        <button
          onClick={load}
          className="btn-ghost text-sm py-1.5 px-3"
          title="Refresh"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          <span className="hidden sm:inline">Refresh</span>
        </button>
      </div>

      {/* ── Cluster Credentials ────────────────────── */}
      <section>
        <div className="flex items-center gap-2.5 mb-4">
          <Key size={16} className="text-nutanix-700" />
          <h2 className="text-base font-semibold text-gray-900">Cluster Credentials</h2>
          {!loading && (
            <span className="badge-purple text-xs">{creds.length}</span>
          )}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="card animate-pulse space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-gray-100 rounded-lg" />
                  <div className="h-4 bg-gray-100 rounded w-32" />
                </div>
                <div className="h-3 bg-gray-100 rounded w-full" />
                <div className="h-3 bg-gray-100 rounded w-3/4" />
                <div className="h-3 bg-gray-100 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : creds.length === 0 ? (
          <div className="card text-center py-12">
            <Server size={36} className="text-gray-200 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No clusters assigned yet</p>
            <p className="text-sm text-gray-400 mt-1">
              Contact your administrator to get cluster access.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {creds.map(cred => (
              <CredentialCard
                key={cred._id}
                cred={cred}
                revealed={!!revealed[cred._id]}
                onToggleReveal={() => toggleReveal(cred._id)}
                onDownload={() => handleDownload(cred)}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

/* ── Credential card ─────────────────────────────────── */

function CredentialCard({ cred, revealed, onToggleReveal, onDownload }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(cred.password)
      setCopied(true)
      toastSuccess('Password copied to clipboard')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toastError('Failed to copy password')
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 hover:border-nutanix-200 hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col">
      {/* Purple accent bar */}
      <div className="h-1 bg-gradient-to-r from-nutanix-800 to-nutanix-500 shrink-0" />

      <div className="p-5 flex flex-col flex-1">
        {/* Card header */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-nutanix-50 border border-nutanix-100 flex items-center justify-center shrink-0">
              <Server size={16} className="text-nutanix-700" />
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-gray-900 truncate">{cred.clusterName}</h3>
              {cred.description && (
                <p className="text-xs text-gray-400 truncate mt-0.5">{cred.description}</p>
              )}
            </div>
          </div>
          <a
            href={cred.dashboardUrl}
            target="_blank"
            rel="noreferrer"
            className="shrink-0 p-1.5 rounded-lg text-nutanix-600 hover:bg-nutanix-50 transition-colors"
            title="Open NKP Dashboard"
          >
            <ExternalLink size={15} />
          </a>
        </div>

        {/* Info rows */}
        <div className="space-y-2.5 text-sm flex-1 mb-4">
          <InfoRow label="Dashboard URL">
            <a
              href={cred.dashboardUrl}
              target="_blank"
              rel="noreferrer"
              className="text-nutanix-700 hover:underline truncate flex items-center gap-1 min-w-0"
            >
              <span className="truncate">{cred.dashboardUrl}</span>
              <ExternalLink size={11} className="shrink-0" />
            </a>
          </InfoRow>

          <InfoRow label="Username">
            <span className="font-mono text-gray-800 select-all">{cred.username}</span>
          </InfoRow>

          <InfoRow label="Password">
            <div className="flex items-center gap-2 min-w-0">
              <span className="font-mono text-gray-800 select-all truncate">
                {revealed ? cred.password : '••••••••••••'}
              </span>
              <button
                onClick={onToggleReveal}
                className="shrink-0 text-gray-400 hover:text-nutanix-700 transition-colors p-0.5 rounded"
                title={revealed ? 'Hide password' : 'Reveal password'}
              >
                {revealed ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
              <button
                onClick={handleCopy}
                className="shrink-0 text-gray-400 hover:text-nutanix-700 transition-colors p-0.5 rounded"
                title="Copy password"
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
              </button>
            </div>
          </InfoRow>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-3 border-t border-gray-50">
          <a
            href={cred.dashboardUrl}
            target="_blank"
            rel="noreferrer"
            className="btn-primary text-xs py-2 flex-1 justify-center"
          >
            <ExternalLink size={13} />
            Open Dashboard
          </a>
          <button
            onClick={onDownload}
            disabled={!cred.hasKubeconfig}
            title={cred.hasKubeconfig ? 'Download kubeconfig' : 'No kubeconfig available'}
            className="btn-secondary text-xs py-2 px-3 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Download size={13} />
            <span className="hidden sm:inline">Kubeconfig</span>
          </button>
        </div>
      </div>
    </div>
  )
}

function InfoRow({ label, children }) {
  return (
    <div className="flex items-center gap-3 min-w-0">
      <span className="text-gray-400 text-xs w-20 shrink-0">{label}</span>
      <div className="min-w-0 flex-1 text-sm">{children}</div>
    </div>
  )
}
