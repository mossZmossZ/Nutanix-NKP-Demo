import { useEffect, useState } from 'react'
import {
  Plus, Pencil, Trash2,
  Download, ExternalLink, X, Save, Server, Users,
} from 'lucide-react'
import api from '@/lib/api'
import { toastSuccess, toastError, confirmDelete } from '@/lib/swal'

const EMPTY_FORM = {
  clusterName: '', dashboardUrl: '',
  kubeconfigYaml: '', description: '',
  assignedUsers: [],
}

export default function Credentials() {
  const [creds, setCreds]       = useState([])
  const [users, setUsers]       = useState([])
  const [loading, setLoading]   = useState(true)
  const [modal, setModal]       = useState(null)
  const [form, setForm]         = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  const load = () => {
    setLoading(true)
    Promise.all([
      api.get('/admin/credentials'),
      api.get('/admin/users'),
    ])
      .then(([credsRes, usersRes]) => {
        setCreds(credsRes.data)
        // Only non-admin users are assignable to portals
        setUsers(usersRes.data.filter(u => u.role !== 'admin'))
      })
      .catch(() => toastError('Failed to load data'))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  const openCreate = () => { setForm(EMPTY_FORM); setModal('create') }
  const openEdit   = (c) => {
    setForm({
      clusterName:    c.clusterName,
      dashboardUrl:   c.dashboardUrl,
      kubeconfigYaml: c.kubeconfigYaml || '',
      description:    c.description || '',
      // assignedUsers may be populated objects or raw IDs — normalise to strings
      assignedUsers:  (c.assignedUsers || []).map(u => u._id?.toString() || u.toString()),
    })
    setModal(c)
  }
  const closeModal = () => setModal(null)

  const handleSave = async () => {
    setSaving(true)
    try {
      if (modal === 'create') {
        await api.post('/admin/credentials', form)
        toastSuccess('Credential created')
      } else {
        await api.put(`/admin/credentials/${modal._id}`, form)
        toastSuccess('Credential updated')
      }
      load(); closeModal()
    } catch (err) {
      toastError(err.response?.data?.message || 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (cred) => {
    const result = await confirmDelete(cred.clusterName)
    if (!result.isConfirmed) return
    try {
      await api.delete(`/admin/credentials/${cred._id}`)
      toastSuccess('Credential deleted'); load()
    } catch (err) {
      toastError(err.response?.data?.message || 'Delete failed')
    }
  }

  const handleDownload = async (cred) => {
    try {
      const res  = await api.get(`/admin/credentials/${cred._id}/kubeconfig`, { responseType: 'blob' })
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
    <div className="w-full space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Cluster Credentials</h2>
          <p className="text-sm text-gray-500 mt-0.5">{creds.length} credentials configured</p>
        </div>
        <button onClick={openCreate} className="btn-primary text-sm py-2 px-3 md:px-4 shrink-0">
          <Plus size={15} />
          <span className="hidden sm:inline">Add Credential</span>
        </button>
      </div>

      {/* Cards grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-100 p-5 animate-pulse space-y-3">
              <div className="h-4 bg-gray-100 rounded w-32" />
              <div className="h-3 bg-gray-100 rounded w-full" />
              <div className="h-3 bg-gray-100 rounded w-3/4" />
            </div>
          ))}
        </div>
      ) : creds.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 py-16 text-center">
          <Server size={32} className="text-gray-200 mx-auto mb-3" />
          <p className="text-sm text-gray-500">No credentials yet.</p>
          <button onClick={openCreate} className="btn-secondary text-sm py-2 px-4 mt-4 inline-flex">
            <Plus size={14} /> Add First Credential
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {creds.map(cred => (
            <CredCard
              key={cred._id}
              cred={cred}
              onEdit={() => openEdit(cred)}
              onDelete={() => handleDelete(cred)}
              onDownload={() => handleDownload(cred)}
            />
          ))}
        </div>
      )}

      {/* Modal */}
      {modal && (
        <CredModal
          title={modal === 'create' ? 'Add Credential' : `Edit — ${modal.clusterName}`}
          form={form}
          setForm={setForm}
          users={users}
          onClose={closeModal}
          onSave={handleSave}
          saving={saving}
        />
      )}
    </div>
  )
}

/* ── Credential card ─────────────────────────────────── */

function CredCard({ cred, onEdit, onDelete, onDownload }) {
  const assignedCount = cred.assignedUsers?.length || 0

  return (
    <div className="bg-white rounded-xl border border-gray-100 hover:border-nutanix-200 hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col">
      <div className="h-1 bg-gradient-to-r from-nutanix-700 to-nutanix-400 shrink-0" />

      <div className="p-4 flex flex-col flex-1">
        {/* Card header */}
        <div className="flex items-start justify-between mb-4 gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-nutanix-50 border border-nutanix-100 flex items-center justify-center shrink-0">
              <Server size={15} className="text-nutanix-700" />
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-gray-900 text-sm truncate">{cred.clusterName}</h3>
              {cred.description && (
                <p className="text-xs text-gray-400 truncate mt-0.5">{cred.description}</p>
              )}
            </div>
          </div>
          <span className={`badge text-xs shrink-0 ${cred.active ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-400'}`}>
            {cred.active ? 'Active' : 'Inactive'}
          </span>
        </div>

        {/* Info rows */}
        <div className="space-y-2 text-xs mb-4 flex-1">
          <InfoRow label="URL">
            <a href={cred.dashboardUrl} target="_blank" rel="noreferrer"
               className="text-nutanix-700 hover:underline flex items-center gap-1 min-w-0">
              <span className="truncate">{cred.dashboardUrl}</span>
              <ExternalLink size={10} className="shrink-0" />
            </a>
          </InfoRow>
          <InfoRow label="Credentials">
            <span className="text-gray-500 italic">Uses user's login credentials</span>
          </InfoRow>
          <InfoRow label="Assigned">
            <span className={`font-medium ${assignedCount > 0 ? 'text-nutanix-700' : 'text-gray-400'}`}>
              {assignedCount > 0 ? `${assignedCount} user${assignedCount > 1 ? 's' : ''}` : 'None'}
            </span>
          </InfoRow>
          <InfoRow label="Kubeconfig">
            {cred.kubeconfigYaml
              ? <span className="text-emerald-600 font-medium">Available</span>
              : <span className="text-gray-400">Not configured</span>
            }
          </InfoRow>
        </div>

        {/* Action row */}
        <div className="flex items-center gap-2 pt-3 border-t border-gray-50">
          <button onClick={onDownload} disabled={!cred.kubeconfigYaml}
            className="btn-secondary text-xs py-1.5 px-3 flex-1 disabled:opacity-40 disabled:cursor-not-allowed">
            <Download size={12} /> Kubeconfig
          </button>
          <button onClick={onEdit} className="p-1.5 rounded-lg text-gray-400 hover:text-nutanix-700 hover:bg-nutanix-50 transition-colors" title="Edit">
            <Pencil size={14} />
          </button>
          <button onClick={onDelete} className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors" title="Delete">
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  )
}

function InfoRow({ label, children }) {
  return (
    <div className="flex items-center gap-2 min-w-0">
      <span className="text-gray-400 w-20 shrink-0">{label}</span>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  )
}

/* ── Credential modal ────────────────────────────────── */

function CredModal({ title, form, setForm, users, onClose, onSave, saving }) {
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  const toggleUser = (userId) => {
    setForm(f => ({
      ...f,
      assignedUsers: f.assignedUsers.includes(userId)
        ? f.assignedUsers.filter(id => id !== userId)
        : [...f.assignedUsers, userId],
    }))
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40">
      <div className="bg-white w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col max-h-[92dvh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
          <h3 className="font-bold text-gray-900">{title}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          {/* Cluster name + description */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <ModalField label="Cluster Name" required>
              <input value={form.clusterName} onChange={set('clusterName')} className="input-field text-sm" placeholder="nkp-demo-cluster" />
            </ModalField>
            <ModalField label="Description">
              <input value={form.description} onChange={set('description')} className="input-field text-sm" placeholder="Optional notes" />
            </ModalField>
          </div>

          <ModalField label="Dashboard URL" required>
            <input value={form.dashboardUrl} onChange={set('dashboardUrl')} className="input-field text-sm" placeholder="https://dashboard.nkp.example.com" />
          </ModalField>

          <div className="bg-nutanix-50 border border-nutanix-100 rounded-lg px-4 py-3 text-xs text-nutanix-700">
            Cluster login credentials are the user's own web login username and password.
            No separate credentials need to be configured here.
          </div>

          {/* Assign users */}
          <ModalField label="Assign Users">
            {users.length === 0 ? (
              <p className="text-xs text-gray-400 py-2">No users available. Create users first.</p>
            ) : (
              <div className="border border-gray-200 rounded-lg divide-y divide-gray-50 max-h-40 overflow-y-auto">
                {users.map(u => (
                  <label
                    key={u._id}
                    className="flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={form.assignedUsers.includes(u._id)}
                      onChange={() => toggleUser(u._id)}
                      className="w-4 h-4 accent-nutanix-700 shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <span className="text-sm text-gray-800 font-medium truncate block">{u.username}</span>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      {u.portalAccess?.includes('demo') && (
                        <span className="badge bg-nutanix-50 text-nutanix-700 text-xs">Demo</span>
                      )}
                      {u.portalAccess?.includes('workshop') && (
                        <span className="badge bg-indigo-50 text-indigo-700 text-xs">Workshop</span>
                      )}
                    </div>
                  </label>
                ))}
              </div>
            )}
            {form.assignedUsers.length > 0 && (
              <p className="text-xs text-nutanix-600 mt-1.5">
                {form.assignedUsers.length} user{form.assignedUsers.length > 1 ? 's' : ''} assigned
              </p>
            )}
          </ModalField>

          {/* Kubeconfig */}
          <ModalField label="Kubeconfig YAML">
            <textarea
              value={form.kubeconfigYaml}
              onChange={set('kubeconfigYaml')}
              rows={6}
              className="input-field text-xs font-mono resize-none"
              placeholder={'apiVersion: v1\nclusters:\n- cluster:\n    server: https://...\n  name: nkp-demo\n...'}
            />
            <p className="text-xs text-gray-400 mt-1">
              Paste kubeconfig content. Assigned users can download it from the Demo Portal.
            </p>
          </ModalField>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 px-5 py-4 border-t border-gray-100 shrink-0">
          <button onClick={onClose} className="btn-secondary text-sm py-2 px-4">Cancel</button>
          <button onClick={onSave} disabled={saving} className="btn-primary text-sm py-2 px-4 disabled:opacity-60">
            {saving
              ? <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              : <><Save size={14} /> Save</>
            }
          </button>
        </div>
      </div>
    </div>
  )
}

function ModalField({ label, children, required }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  )
}
