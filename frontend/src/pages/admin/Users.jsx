import { useEffect, useState } from 'react'
import { UserPlus, Search, Pencil, Trash2, X, Save } from 'lucide-react'
import api from '@/lib/api'
import { toastSuccess, toastError, confirmDelete } from '@/lib/swal'

const EMPTY_FORM = { username: '', password: '', role: 'user', portalAccess: [], active: true }

export default function UsersPage() {
  const [users, setUsers]     = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch]   = useState('')
  const [modal, setModal]     = useState(null) // null | 'create' | { ...user }
  const [form, setForm]       = useState(EMPTY_FORM)
  const [saving, setSaving]   = useState(false)

  const load = () => {
    setLoading(true)
    api.get('/admin/users')
      .then(r => setUsers(r.data))
      .catch(() => toastError('Failed to load users'))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  const openCreate = () => { setForm(EMPTY_FORM); setModal('create') }
  const openEdit   = (user) => {
    setForm({ username: user.username, password: '', role: user.role, portalAccess: [...user.portalAccess], active: user.active })
    setModal(user)
  }
  const closeModal = () => setModal(null)

  const toggleAccess = (portal) => {
    setForm(f => ({
      ...f,
      portalAccess: f.portalAccess.includes(portal)
        ? f.portalAccess.filter(p => p !== portal)
        : [...f.portalAccess, portal],
    }))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      if (modal === 'create') {
        await api.post('/admin/users', form)
        toastSuccess('User created')
      } else {
        const payload = { ...form }
        if (!payload.password) delete payload.password
        await api.put(`/admin/users/${modal._id}`, payload)
        toastSuccess('User updated')
      }
      load()
      closeModal()
    } catch (err) {
      toastError(err.response?.data?.message || 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (user) => {
    const result = await confirmDelete(user.username)
    if (!result.isConfirmed) return
    try {
      await api.delete(`/admin/users/${user._id}`)
      toastSuccess('User deleted')
      load()
    } catch (err) {
      toastError(err.response?.data?.message || 'Delete failed')
    }
  }

  // Filter by username only (no email field)
  const filtered = users.filter(u =>
    u.username.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="w-full space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Users</h2>
          <p className="text-sm text-gray-500 mt-0.5">{users.length} total users</p>
        </div>
        <button onClick={openCreate} className="btn-primary text-sm py-2 px-3 md:px-4 shrink-0">
          <UserPlus size={15} />
          <span className="hidden sm:inline">Add User</span>
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        <input
          type="text"
          placeholder="Search by username…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="input-field pl-9 text-sm"
        />
      </div>

      {/* Table — horizontal scroll on small screens */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[500px]">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
                <th className="text-left px-4 py-3 font-semibold">Username</th>
                <th className="text-left px-4 py-3 font-semibold hidden sm:table-cell">Role</th>
                <th className="text-left px-4 py-3 font-semibold">Portal Access</th>
                <th className="text-left px-4 py-3 font-semibold hidden md:table-cell">Status</th>
                <th className="px-4 py-3 w-20" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading
                ? Array.from({ length: 4 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="px-4 py-4"><div className="h-4 bg-gray-100 rounded w-28" /></td>
                      <td className="px-4 py-4 hidden sm:table-cell"><div className="h-4 bg-gray-100 rounded w-14" /></td>
                      <td className="px-4 py-4"><div className="h-4 bg-gray-100 rounded w-24" /></td>
                      <td className="px-4 py-4 hidden md:table-cell"><div className="h-4 bg-gray-100 rounded w-12" /></td>
                      <td className="px-4 py-4" />
                    </tr>
                  ))
                : filtered.map(user => (
                    <tr key={user._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-nutanix-100 flex items-center justify-center shrink-0">
                            <span className="text-nutanix-700 text-xs font-bold">
                              {user.username[0].toUpperCase()}
                            </span>
                          </div>
                          <span className="font-medium text-gray-900 truncate max-w-[120px]">
                            {user.username}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <RoleBadge role={user.role} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1 flex-wrap">
                          <AccessBadge label="Demo"     active={user.portalAccess.includes('demo')} />
                          <AccessBadge label="Workshop" active={user.portalAccess.includes('workshop')} />
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <span className={`badge text-xs ${user.active ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                          {user.active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 justify-end">
                          <button
                            onClick={() => openEdit(user)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-nutanix-700 hover:bg-nutanix-50 transition-colors"
                            title="Edit"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={() => handleDelete(user)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                            title="Delete"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
              }
            </tbody>
          </table>
        </div>
        {!loading && filtered.length === 0 && (
          <div className="py-10 text-center text-sm text-gray-400">
            {search ? `No users matching "${search}"` : 'No users found.'}
          </div>
        )}
      </div>

      {/* Modal */}
      {modal && (
        <Modal
          title={modal === 'create' ? 'Add User' : `Edit — ${modal.username}`}
          onClose={closeModal}
        >
          <div className="space-y-4">
            <Field label="Username">
              <input
                value={form.username}
                onChange={e => setForm({ ...form, username: e.target.value })}
                className="input-field text-sm"
                placeholder="username"
                autoComplete="off"
              />
            </Field>
            <Field label={modal === 'create' ? 'Password' : 'New Password (leave blank to keep)'}>
              <input
                type="password"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                className="input-field text-sm"
                placeholder="••••••••"
              />
            </Field>
            <Field label="Role">
              <select
                value={form.role}
                onChange={e => setForm({ ...form, role: e.target.value })}
                className="input-field text-sm"
              >
                <option value="user">User</option>
                <option value="instructor">Instructor</option>
                <option value="admin">Admin</option>
              </select>
            </Field>
            <Field label="Portal Access">
              <div className="flex gap-4 pt-1">
                {['demo', 'workshop'].map(p => (
                  <label key={p} className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={form.portalAccess.includes(p)}
                      onChange={() => toggleAccess(p)}
                      className="w-4 h-4 accent-nutanix-700"
                    />
                    <span className="text-sm text-gray-700 capitalize">{p}</span>
                  </label>
                ))}
              </div>
            </Field>
            <Field label="Status">
              <label className="flex items-center gap-2 cursor-pointer select-none pt-1">
                <input
                  type="checkbox"
                  checked={form.active}
                  onChange={e => setForm({ ...form, active: e.target.checked })}
                  className="w-4 h-4 accent-nutanix-700"
                />
                <span className="text-sm text-gray-700">Active</span>
              </label>
            </Field>
          </div>
          <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-gray-100">
            <button onClick={closeModal} className="btn-secondary text-sm py-2 px-4">Cancel</button>
            <button onClick={handleSave} disabled={saving} className="btn-primary text-sm py-2 px-4 disabled:opacity-60">
              {saving
                ? <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                : <><Save size={14} /> Save</>
              }
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}

/* ── Helpers ─────────────────────────────────────────── */

function RoleBadge({ role }) {
  const map = {
    admin:      'bg-nutanix-50 text-nutanix-700 border-nutanix-100',
    instructor: 'bg-amber-50   text-amber-700   border-amber-100',
    user:       'bg-gray-50    text-gray-600    border-gray-200',
  }
  return <span className={`badge border text-xs ${map[role] || map.user}`}>{role}</span>
}

function AccessBadge({ label, active }) {
  return (
    <span className={`badge text-xs ${active ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-400'}`}>
      {label}
    </span>
  )
}

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">
        {label}
      </label>
      {children}
    </div>
  )
}

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40">
      <div className="bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col max-h-[90dvh]">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
          <h3 className="font-bold text-gray-900">{title}</h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"
          >
            <X size={16} />
          </button>
        </div>
        <div className="p-5 overflow-y-auto flex-1">{children}</div>
      </div>
    </div>
  )
}
