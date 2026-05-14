import { useEffect, useState } from 'react'
import {
  Plus, Pencil, Trash2, X, Save, BadgeCheck,
  Eye, EyeOff, Copy, Check, Globe,
} from 'lucide-react'
import api from '@/lib/api'
import { toastSuccess, toastError, confirmDelete } from '@/lib/swal'

const EMPTY_FORM = { workshopId: '', userId: '', isGlobal: false, fields: [] }

export default function WorkshopCredentials() {
  const [credentials, setCredentials] = useState([])
  const [workshops, setWorkshops]     = useState([])
  const [users, setUsers]             = useState([])
  const [loading, setLoading]         = useState(true)
  const [modal, setModal]             = useState(null)
  const [form, setForm]               = useState(EMPTY_FORM)
  const [saving, setSaving]           = useState(false)

  const load = () => {
    setLoading(true)
    Promise.all([
      api.get('/admin/workshop-credentials'),
      api.get('/admin/workshops'),
      api.get('/admin/users'),
    ])
      .then(([credsRes, wsRes, usersRes]) => {
        setCredentials(credsRes.data)
        setWorkshops(wsRes.data)
        setUsers(usersRes.data.filter(u => u.role !== 'admin'))
      })
      .catch(() => toastError('Failed to load data'))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  const openCreate = () => { setForm(EMPTY_FORM); setModal('create') }

  const openEdit = (c) => {
    setForm({
      workshopId: c.workshopId?._id || c.workshopId,
      userId:     c.userId?._id     || c.userId     || '',
      isGlobal:   c.isGlobal || false,
      fields:     c.fields || [],
    })
    setModal(c)
  }

  // Rebuild fields from workshop template when workshop changes (preserving existing values)
  const handleWorkshopChange = (workshopId) => {
    const ws     = workshops.find(w => w._id === workshopId)
    const fields = (ws?.credentialFields || []).map(f => ({
      name:  f.name,
      value: form.fields.find(ef => ef.name === f.name)?.value || '',
    }))
    setForm(f => ({ ...f, workshopId, fields }))
  }

  const handleGlobalToggle = (isGlobal) => {
    setForm(f => ({ ...f, isGlobal, userId: isGlobal ? '' : f.userId }))
  }

  const updateFieldValue = (name, value) => {
    setForm(f => ({
      ...f,
      fields: f.fields.map(field => field.name === name ? { ...field, value } : field),
    }))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      if (modal === 'create') {
        await api.post('/admin/workshop-credentials', form)
        toastSuccess(form.isGlobal ? 'Global credential saved' : 'Credentials saved')
      } else {
        await api.put(`/admin/workshop-credentials/${modal._id}`, { fields: form.fields })
        toastSuccess('Credentials updated')
      }
      load(); setModal(null)
    } catch (err) {
      toastError(err.response?.data?.message || 'Save failed')
    } finally { setSaving(false) }
  }

  const handleDelete = async (c) => {
    const label = c.isGlobal
      ? `global credential for ${c.workshopId?.title || 'workshop'}`
      : `${c.userId?.username || 'user'}'s credentials for ${c.workshopId?.title || 'workshop'}`
    const result = await confirmDelete(label)
    if (!result.isConfirmed) return
    try {
      await api.delete(`/admin/workshop-credentials/${c._id}`)
      toastSuccess('Deleted'); load()
    } catch { toastError('Delete failed') }
  }

  const selectedWorkshop = workshops.find(w => w._id === form.workshopId)
  const fieldTemplate    = selectedWorkshop?.credentialFields || []
  const isEdit           = modal !== null && modal !== 'create'
  const canSave          = isEdit || (form.workshopId && (form.isGlobal || form.userId))

  // Separate global from per-user for display
  const globalCreds  = credentials.filter(c => c.isGlobal)
  const perUserCreds = credentials.filter(c => !c.isGlobal)

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Workshop Credentials</h2>
          <p className="text-sm text-gray-500 mt-0.5">Per-user and global lab credentials</p>
        </div>
        <button onClick={openCreate} className="btn-primary text-sm py-2 px-3 md:px-4 shrink-0">
          <Plus size={15} /> <span className="hidden sm:inline">Assign Credentials</span>
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2].map(i => (
            <div key={i} className="bg-white rounded-xl border border-gray-100 p-4 animate-pulse space-y-2">
              <div className="h-4 bg-gray-100 rounded w-40" />
            </div>
          ))}
        </div>
      ) : credentials.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 py-16 text-center">
          <BadgeCheck size={32} className="text-gray-200 mx-auto mb-3" />
          <p className="text-sm text-gray-500">No workshop credentials assigned yet.</p>
          <button onClick={openCreate} className="btn-secondary text-sm py-2 px-4 mt-4 inline-flex">
            <Plus size={14} /> Assign First
          </button>
        </div>
      ) : (
        <>
          {/* Global credentials section */}
          {globalCreds.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Globe size={13} className="text-blue-600" />
                <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide">
                  Global Credentials ({globalCreds.length})
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {globalCreds.map(c => (
                  <CredCard key={c._id} cred={c} onEdit={() => openEdit(c)} onDelete={() => handleDelete(c)} />
                ))}
              </div>
            </div>
          )}

          {/* Per-user credentials section */}
          {perUserCreds.length > 0 && (
            <div className="space-y-3">
              {globalCreds.length > 0 && (
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Per-User Credentials ({perUserCreds.length})
                </p>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {perUserCreds.map(c => (
                  <CredCard key={c._id} cred={c} onEdit={() => openEdit(c)} onDelete={() => handleDelete(c)} />
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {modal && (
        <CredModal
          title={isEdit ? 'Edit Credentials' : 'Assign Workshop Credentials'}
          form={form}
          workshops={workshops}
          users={users}
          fieldTemplate={fieldTemplate}
          isEdit={isEdit}
          canSave={canSave}
          onWorkshopChange={handleWorkshopChange}
          onGlobalToggle={handleGlobalToggle}
          onFieldChange={updateFieldValue}
          onUserChange={userId => setForm(f => ({ ...f, userId }))}
          onClose={() => setModal(null)}
          onSave={handleSave}
          saving={saving}
        />
      )}
    </div>
  )
}

// ── Credential card ───────────────────────────────────────────────────────────

function CredCard({ cred, onEdit, onDelete }) {
  const ws      = cred.workshopId
  const user    = cred.userId
  const labelMap = Object.fromEntries((ws?.credentialFields || []).map(f => [f.name, f.label]))

  return (
    <div className={`bg-white rounded-xl border hover:shadow-md transition-all duration-200 p-4 flex flex-col gap-3 ${
      cred.isGlobal ? 'border-blue-100 hover:border-blue-300' : 'border-gray-100 hover:border-indigo-200'
    }`}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          {cred.isGlobal ? (
            <div className="flex items-center gap-1.5 mb-1">
              <span className="inline-flex items-center gap-1 text-[11px] bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full font-semibold">
                <Globe size={9} /> Global
              </span>
            </div>
          ) : (
            <p className="font-bold text-gray-900 text-sm truncate mb-0.5">{user?.username || 'Unknown user'}</p>
          )}
          <p className="text-xs font-medium truncate" style={{ color: cred.isGlobal ? '#3b82f6' : '#4338ca' }}>
            {ws?.title || 'Unknown workshop'}
          </p>
          {cred.isGlobal && (
            <p className="text-[11px] text-gray-400 mt-0.5">Shared by all users</p>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button onClick={onEdit} className="p-1.5 rounded text-gray-400 hover:text-indigo-700 hover:bg-indigo-50 transition-colors">
            <Pencil size={14} />
          </button>
          <button onClick={onDelete} className="p-1.5 rounded text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors">
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      <div className="space-y-1.5 border-t border-gray-50 pt-2">
        {(cred.fields || []).map(f => (
          <div key={f.name} className="flex items-center gap-2 text-xs">
            <span className="text-gray-400 w-28 shrink-0 truncate">{labelMap[f.name] || f.name}</span>
            <span className="text-gray-700 truncate font-mono">{f.value || '—'}</span>
          </div>
        ))}
        {(!cred.fields || cred.fields.length === 0) && (
          <p className="text-xs text-gray-400 italic">No field values set</p>
        )}
      </div>
    </div>
  )
}

// ── Credential modal ──────────────────────────────────────────────────────────

function CredModal({
  title, form, workshops, users, fieldTemplate,
  isEdit, canSave,
  onWorkshopChange, onGlobalToggle, onFieldChange, onUserChange,
  onClose, onSave, saving,
}) {
  const [revealed, setRevealed] = useState({})
  const [copied, setCopied]     = useState({})

  const toggleReveal = (name) => setRevealed(p => ({ ...p, [name]: !p[name] }))

  const copyField = (name, value) => {
    navigator.clipboard.writeText(value || '')
    setCopied(p => ({ ...p, [name]: true }))
    setTimeout(() => setCopied(p => ({ ...p, [name]: false })), 2000)
  }

  // Find the user display name for edit mode
  const editUserName = isEdit && !form.isGlobal
    ? users.find(u => u._id === form.userId)?.username || 'Unknown user'
    : null

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

        <div className="p-5 overflow-y-auto flex-1 space-y-4">

          {/* Global toggle (create only) */}
          {!isEdit && (
            <button
              type="button"
              onClick={() => onGlobalToggle(!form.isGlobal)}
              className={`w-full text-left rounded-xl border p-4 transition-all ${
                form.isGlobal
                  ? 'bg-blue-50 border-blue-200'
                  : 'bg-gray-50 border-gray-100 hover:border-gray-200'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`w-4 h-4 rounded border-2 mt-0.5 flex items-center justify-center shrink-0 transition-colors ${
                  form.isGlobal ? 'bg-blue-600 border-blue-600' : 'border-gray-300'
                }`}>
                  {form.isGlobal && <Check size={10} className="text-white" strokeWidth={3} />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <Globe size={14} className={form.isGlobal ? 'text-blue-600' : 'text-gray-400'} />
                    <span className="text-sm font-semibold text-gray-800">Global Credential</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    All users in this workshop share the same values
                  </p>
                </div>
              </div>
            </button>
          )}

          {/* Edit mode: show global or user badge */}
          {isEdit && form.isGlobal && (
            <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 flex items-center gap-2.5">
              <Globe size={14} className="text-blue-600 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-blue-800">Global Credential</p>
                <p className="text-xs text-blue-600 mt-0.5">Applies to all users in this workshop</p>
              </div>
            </div>
          )}
          {isEdit && !form.isGlobal && editUserName && (
            <div className="bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-3 text-sm text-indigo-800">
              User: <span className="font-semibold">{editUserName}</span>
            </div>
          )}

          {/* Workshop + User selectors (create only) */}
          {!isEdit && (
            <div className={`grid gap-4 ${form.isGlobal ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2'}`}>
              <ModalField label="Workshop" required>
                <select
                  value={form.workshopId}
                  onChange={e => onWorkshopChange(e.target.value)}
                  className="input-field text-sm"
                >
                  <option value="">Select workshop</option>
                  {workshops.map(w => <option key={w._id} value={w._id}>{w.title}</option>)}
                </select>
              </ModalField>

              {!form.isGlobal && (
                <ModalField label="User" required>
                  <select
                    value={form.userId}
                    onChange={e => onUserChange(e.target.value)}
                    className="input-field text-sm"
                  >
                    <option value="">Select user</option>
                    {users.map(u => <option key={u._id} value={u._id}>{u.username}</option>)}
                  </select>
                </ModalField>
              )}
            </div>
          )}

          {/* Dynamic field values */}
          {form.fields.length > 0 ? (
            <div className="space-y-3">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Field Values
                <span className="ml-2 text-gray-400 normal-case font-normal">{form.fields.length} field{form.fields.length !== 1 ? 's' : ''}</span>
              </p>
              {form.fields.map(field => {
                const tmpl       = fieldTemplate.find(t => t.name === field.name) || { label: field.name, type: 'text' }
                const isPassword = tmpl.type === 'password'

                return (
                  <div key={field.name}>
                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">
                      {tmpl.label}
                      <span className="ml-1.5 normal-case font-normal text-gray-400">({tmpl.type})</span>
                    </label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type={isPassword && !revealed[field.name] ? 'password' : 'text'}
                        value={field.value}
                        onChange={e => onFieldChange(field.name, e.target.value)}
                        className="input-field text-sm flex-1 font-mono"
                        placeholder={
                          isPassword ? '••••••••'
                          : tmpl.type === 'url' ? 'https://'
                          : 'value'
                        }
                      />
                      {isPassword && (
                        <button
                          type="button"
                          onClick={() => toggleReveal(field.name)}
                          className="p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors shrink-0"
                          title={revealed[field.name] ? 'Hide' : 'Reveal'}
                        >
                          {revealed[field.name] ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => copyField(field.name, field.value)}
                        className="p-2 rounded-lg text-gray-400 hover:text-nutanix-700 hover:bg-nutanix-50 transition-colors shrink-0"
                        title="Copy value"
                      >
                        {copied[field.name]
                          ? <Check size={15} className="text-emerald-500" />
                          : <Copy size={15} />
                        }
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : form.workshopId ? (
            <div className="bg-amber-50 border border-amber-100 rounded-lg px-4 py-3 text-xs text-amber-700">
              This workshop has no credential fields. Add fields to the workshop first.
            </div>
          ) : (
            <div className="bg-gray-50 border border-gray-100 rounded-lg px-4 py-3 text-xs text-gray-500">
              Select a workshop to see its credential fields.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 px-5 py-4 border-t border-gray-100 shrink-0">
          <button onClick={onClose} className="btn-secondary text-sm py-2 px-4">Cancel</button>
          <button onClick={onSave} disabled={saving || !canSave} className="btn-primary text-sm py-2 px-4 disabled:opacity-60">
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
