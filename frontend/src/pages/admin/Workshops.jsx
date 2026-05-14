import { useEffect, useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import {
  Plus, Pencil, Trash2, X, Save, GraduationCap,
  FileText, ArrowLeft, ChevronUp, ChevronDown,
  Bold, Italic, Code, Quote,
} from 'lucide-react'
import api from '@/lib/api'
import { toastSuccess, toastError, confirmDelete } from '@/lib/swal'

export default function Workshops() {
  const [view, setView] = useState('list')
  if (view === 'list') return <WorkshopList onManagePages={setView} />
  return <PageManager workshop={view} onBack={() => setView('list')} />
}

// ── Workshop List ─────────────────────────────────────────────────────────────

const EMPTY_WORKSHOP = { title: '', description: '', credentialFields: [], assignedUsers: [], active: true }

function WorkshopList({ onManagePages }) {
  const [workshops, setWorkshops] = useState([])
  const [users, setUsers]         = useState([])
  const [loading, setLoading]     = useState(true)
  const [modal, setModal]         = useState(null)
  const [form, setForm]           = useState(EMPTY_WORKSHOP)
  const [saving, setSaving]       = useState(false)

  const load = () => {
    setLoading(true)
    Promise.all([api.get('/admin/workshops'), api.get('/admin/users')])
      .then(([ws, us]) => {
        setWorkshops(ws.data)
        setUsers(us.data.filter(u => u.role !== 'admin'))
      })
      .catch(() => toastError('Failed to load workshops'))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  const openCreate = () => { setForm(EMPTY_WORKSHOP); setModal('create') }
  const openEdit   = (w) => {
    setForm({
      title:            w.title,
      description:      w.description || '',
      credentialFields: w.credentialFields || [],
      assignedUsers:    (w.assignedUsers || []).map(u => u._id?.toString() || u.toString()),
      active:           w.active,
    })
    setModal(w)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      if (modal === 'create') {
        await api.post('/admin/workshops', form)
        toastSuccess('Workshop created')
      } else {
        await api.put(`/admin/workshops/${modal._id}`, form)
        toastSuccess('Workshop updated')
      }
      load(); setModal(null)
    } catch (err) {
      toastError(err.response?.data?.message || 'Save failed')
    } finally { setSaving(false) }
  }

  const handleDelete = async (w) => {
    const result = await confirmDelete(w.title)
    if (!result.isConfirmed) return
    try {
      await api.delete(`/admin/workshops/${w._id}`)
      toastSuccess('Workshop deleted'); load()
    } catch { toastError('Delete failed') }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Workshops</h2>
          <p className="text-sm text-gray-500 mt-0.5">{workshops.length} workshops configured</p>
        </div>
        <button onClick={openCreate} className="btn-primary text-sm py-2 px-3 md:px-4 shrink-0">
          <Plus size={15} /> <span className="hidden sm:inline">New Workshop</span>
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[1, 2].map(i => (
            <div key={i} className="bg-white rounded-xl border border-gray-100 p-5 animate-pulse space-y-3">
              <div className="h-4 bg-gray-100 rounded w-40" />
              <div className="h-3 bg-gray-100 rounded w-full" />
            </div>
          ))}
        </div>
      ) : workshops.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 py-16 text-center">
          <GraduationCap size={32} className="text-gray-200 mx-auto mb-3" />
          <p className="text-sm text-gray-500">No workshops yet.</p>
          <button onClick={openCreate} className="btn-secondary text-sm py-2 px-4 mt-4 inline-flex">
            <Plus size={14} /> Create Workshop
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {workshops.map(w => (
            <WorkshopCard
              key={w._id}
              workshop={w}
              onEdit={() => openEdit(w)}
              onDelete={() => handleDelete(w)}
              onManagePages={() => onManagePages({
                id: w._id,
                title: w.title,
                credentialFields: w.credentialFields || [],
              })}
            />
          ))}
        </div>
      )}

      {modal && (
        <WorkshopModal
          title={modal === 'create' ? 'New Workshop' : `Edit — ${modal.title}`}
          form={form} setForm={setForm} users={users}
          onClose={() => setModal(null)} onSave={handleSave} saving={saving}
        />
      )}
    </div>
  )
}

function WorkshopCard({ workshop, onEdit, onDelete, onManagePages }) {
  const fieldCount = workshop.credentialFields?.length || 0
  const userCount  = workshop.assignedUsers?.length   || 0

  return (
    <div className="bg-white rounded-xl border border-gray-100 hover:border-indigo-200 hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col">
      <div className="h-1 bg-gradient-to-r from-indigo-700 to-nutanix-600 shrink-0" />
      <div className="p-4 flex flex-col flex-1">
        <div className="flex items-start justify-between mb-3 gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0">
              <GraduationCap size={15} className="text-indigo-700" />
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-gray-900 text-sm truncate">{workshop.title}</h3>
              {workshop.description && (
                <p className="text-xs text-gray-400 truncate mt-0.5">{workshop.description}</p>
              )}
            </div>
          </div>
          <span className={`badge text-xs shrink-0 ${workshop.active ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-400'}`}>
            {workshop.active ? 'Active' : 'Inactive'}
          </span>
        </div>

        <div className="space-y-1.5 text-xs mb-4 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-gray-400 w-28 shrink-0">Credential Fields</span>
            <span className={`font-medium ${fieldCount > 0 ? 'text-indigo-700' : 'text-gray-400'}`}>
              {fieldCount} field{fieldCount !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-400 w-28 shrink-0">Assigned Users</span>
            <span className={`font-medium ${userCount > 0 ? 'text-nutanix-700' : 'text-gray-400'}`}>
              {userCount > 0 ? `${userCount} user${userCount > 1 ? 's' : ''}` : 'All workshop users'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 pt-3 border-t border-gray-50">
          <button onClick={onManagePages} className="btn-secondary text-xs py-1.5 px-3 flex-1">
            <FileText size={12} /> Manage Pages
          </button>
          <button onClick={onEdit} className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-700 hover:bg-indigo-50 transition-colors" title="Edit">
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

function WorkshopModal({ title, form, setForm, users, onClose, onSave, saving }) {
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  const addField = () => setForm(f => ({
    ...f,
    credentialFields: [...f.credentialFields, { name: '', label: '', type: 'text' }],
  }))

  const updateField = (idx, key, value) => setForm(f => ({
    ...f,
    credentialFields: f.credentialFields.map((field, i) => i === idx ? { ...field, [key]: value } : field),
  }))

  const removeField = (idx) => setForm(f => ({
    ...f,
    credentialFields: f.credentialFields.filter((_, i) => i !== idx),
  }))

  const toggleUser = (id) => setForm(f => ({
    ...f,
    assignedUsers: f.assignedUsers.includes(id)
      ? f.assignedUsers.filter(u => u !== id)
      : [...f.assignedUsers, id],
  }))

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40">
      <div className="bg-white w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col max-h-[92dvh]">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
          <h3 className="font-bold text-gray-900">{title}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors">
            <X size={16} />
          </button>
        </div>

        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          <ModalField label="Title" required>
            <input value={form.title} onChange={set('title')} className="input-field text-sm" placeholder="Docker Basics Workshop" />
          </ModalField>

          <ModalField label="Description">
            <input value={form.description} onChange={set('description')} className="input-field text-sm" placeholder="Brief overview of this workshop" />
          </ModalField>

          <ModalField label="Credential Fields">
            <div className="space-y-2 mb-2">
              {form.credentialFields.map((field, idx) => (
                <div key={idx} className="flex items-center gap-2 p-2.5 bg-gray-50 rounded-lg border border-gray-100">
                  <input
                    value={field.name}
                    onChange={e => updateField(idx, 'name', e.target.value)}
                    className="input-field text-xs flex-1 min-w-0"
                    placeholder="fieldName"
                  />
                  <input
                    value={field.label}
                    onChange={e => updateField(idx, 'label', e.target.value)}
                    className="input-field text-xs flex-1 min-w-0"
                    placeholder="Display Label"
                  />
                  <select
                    value={field.type}
                    onChange={e => updateField(idx, 'type', e.target.value)}
                    className="input-field text-xs w-24 shrink-0"
                  >
                    <option value="text">Text</option>
                    <option value="password">Password</option>
                    <option value="url">URL</option>
                  </select>
                  <button onClick={() => removeField(idx)} className="p-1 text-gray-400 hover:text-red-500 transition-colors shrink-0">
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
            <button onClick={addField} className="btn-secondary text-xs py-1.5 px-3">
              <Plus size={12} /> Add Field
            </button>
            <p className="text-xs text-gray-400 mt-1.5">
              Fields become <code className="bg-gray-100 px-1 rounded text-indigo-700">${'{fieldName}'}</code> variables in page content
            </p>
          </ModalField>

          <ModalField label="Assign Users">
            {users.length === 0 ? (
              <p className="text-xs text-gray-400 py-1">No users available.</p>
            ) : (
              <div className="border border-gray-200 rounded-lg divide-y divide-gray-50 max-h-40 overflow-y-auto">
                {users.map(u => (
                  <label key={u._id} className="flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      checked={form.assignedUsers.includes(u._id)}
                      onChange={() => toggleUser(u._id)}
                      className="w-4 h-4 accent-indigo-700 shrink-0"
                    />
                    <span className="text-sm text-gray-800">{u.username}</span>
                  </label>
                ))}
              </div>
            )}
            <p className="text-xs text-gray-400 mt-1.5">Leave empty to allow all workshop-access users</p>
          </ModalField>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={form.active}
              onChange={e => setForm(f => ({ ...f, active: e.target.checked }))}
              className="w-4 h-4 accent-indigo-700"
            />
            <span className="text-sm text-gray-700 font-medium">Active (visible to users)</span>
          </label>
        </div>

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

// ── Page Manager ──────────────────────────────────────────────────────────────

const EMPTY_PAGE = { title: '', content: '', published: true }

function PageManager({ workshop, onBack }) {
  const [pages, setPages]     = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal]     = useState(null)
  const [form, setForm]       = useState(EMPTY_PAGE)
  const [saving, setSaving]   = useState(false)

  const load = () => {
    setLoading(true)
    api.get(`/admin/workshops/${workshop.id}/pages`)
      .then(res => setPages(res.data))
      .catch(() => toastError('Failed to load pages'))
      .finally(() => setLoading(false))
  }

  useEffect(load, [workshop.id])

  const openCreate = () => { setForm(EMPTY_PAGE); setModal('create') }
  const openEdit   = (p) => { setForm({ title: p.title, content: p.content || '', published: p.published }); setModal(p) }

  const handleSave = async () => {
    setSaving(true)
    try {
      if (modal === 'create') {
        await api.post(`/admin/workshops/${workshop.id}/pages`, form)
        toastSuccess('Page created')
      } else {
        await api.put(`/admin/workshops/${workshop.id}/pages/${modal._id}`, form)
        toastSuccess('Page updated')
      }
      load(); setModal(null)
    } catch (err) {
      toastError(err.response?.data?.message || 'Save failed')
    } finally { setSaving(false) }
  }

  const handleDelete = async (page) => {
    const result = await confirmDelete(page.title)
    if (!result.isConfirmed) return
    try {
      await api.delete(`/admin/workshops/${workshop.id}/pages/${page._id}`)
      toastSuccess('Page deleted'); load()
    } catch { toastError('Delete failed') }
  }

  const move = async (page, direction) => {
    const idx     = pages.findIndex(p => p._id === page._id)
    const swapIdx = idx + direction
    if (swapIdx < 0 || swapIdx >= pages.length) return
    const swap = pages[swapIdx]
    try {
      await Promise.all([
        api.put(`/admin/workshops/${workshop.id}/pages/${page._id}`, { order: swap.order }),
        api.put(`/admin/workshops/${workshop.id}/pages/${swap._id}`, { order: page.order }),
      ])
      load()
    } catch { toastError('Reorder failed') }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors">
          <ArrowLeft size={16} />
        </button>
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-bold text-gray-900 truncate">Pages — {workshop.title}</h2>
          <p className="text-sm text-gray-500 mt-0.5">{pages.length} page{pages.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={openCreate} className="btn-primary text-sm py-2 px-3 md:px-4 shrink-0">
          <Plus size={15} /> <span className="hidden sm:inline">Add Page</span>
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white rounded-xl border border-gray-100 p-4 animate-pulse space-y-2">
              <div className="h-4 bg-gray-100 rounded w-32" />
            </div>
          ))}
        </div>
      ) : pages.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 py-16 text-center">
          <FileText size={32} className="text-gray-200 mx-auto mb-3" />
          <p className="text-sm text-gray-500">No pages yet.</p>
          <button onClick={openCreate} className="btn-secondary text-sm py-2 px-4 mt-4 inline-flex">
            <Plus size={14} /> Add First Page
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {pages.map((page, idx) => (
            <div key={page._id} className="bg-white rounded-xl border border-gray-100 hover:border-indigo-200 transition-colors p-4 flex items-center gap-4">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0">
                <span className="text-indigo-700 font-bold text-sm">{idx + 1}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 text-sm truncate">{page.title}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {page.content?.length > 0 ? `${page.content.length} chars` : 'No content'}
                  {' · '}
                  <span className={page.published ? 'text-emerald-600' : 'text-amber-500'}>
                    {page.published ? 'Published' : 'Draft'}
                  </span>
                </p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => move(page, -1)} disabled={idx === 0}
                  className="p-1.5 rounded text-gray-300 hover:text-gray-700 disabled:opacity-30 hover:bg-gray-100 transition-colors">
                  <ChevronUp size={14} />
                </button>
                <button onClick={() => move(page, 1)} disabled={idx === pages.length - 1}
                  className="p-1.5 rounded text-gray-300 hover:text-gray-700 disabled:opacity-30 hover:bg-gray-100 transition-colors">
                  <ChevronDown size={14} />
                </button>
                <button onClick={() => openEdit(page)}
                  className="p-1.5 rounded text-gray-400 hover:text-indigo-700 hover:bg-indigo-50 transition-colors">
                  <Pencil size={14} />
                </button>
                <button onClick={() => handleDelete(page)}
                  className="p-1.5 rounded text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <PageModal
          title={modal === 'create' ? 'New Page' : `Edit — ${modal.title}`}
          form={form}
          setForm={setForm}
          credentialFields={workshop.credentialFields || []}
          onClose={() => setModal(null)}
          onSave={handleSave}
          saving={saving}
        />
      )}
    </div>
  )
}

// ── Page Modal — split-view editor ─────────────────────────────────────────────

function PageModal({ title, form, setForm, credentialFields, onClose, onSave, saving }) {
  const [activeTab, setActiveTab] = useState('write')
  const textareaRef = useRef(null)

  // Insert text at current cursor position
  const insertAtCursor = (text) => {
    const el = textareaRef.current
    if (!el) return
    const pos = el.selectionStart
    const newContent = form.content.slice(0, pos) + text + form.content.slice(pos)
    setForm(f => ({ ...f, content: newContent }))
    requestAnimationFrame(() => {
      el.selectionStart = el.selectionEnd = pos + text.length
      el.focus()
    })
  }

  // Wrap selected text (or "text" placeholder) with before/after markers
  const insertMarkdown = (before, after = '') => {
    const el = textareaRef.current
    if (!el) return
    const start    = el.selectionStart
    const end      = el.selectionEnd
    const selected = form.content.slice(start, end)
    const inner    = selected || 'text'
    const newContent = form.content.slice(0, start) + before + inner + after + form.content.slice(end)
    setForm(f => ({ ...f, content: newContent }))
    requestAnimationFrame(() => {
      el.selectionStart = start + before.length
      el.selectionEnd   = start + before.length + inner.length
      el.focus()
    })
  }

  // Insert a block-level prefix at the current line start
  const insertBlock = (prefix) => {
    const el = textareaRef.current
    if (!el) return
    const pos        = el.selectionStart
    const needsBreak = pos > 0 && form.content[pos - 1] !== '\n'
    const insertion  = (needsBreak ? '\n' : '') + prefix
    const newContent = form.content.slice(0, pos) + insertion + form.content.slice(pos)
    setForm(f => ({ ...f, content: newContent }))
    requestAnimationFrame(() => {
      el.selectionStart = el.selectionEnd = pos + insertion.length
      el.focus()
    })
  }

  // Insert a fenced code block and place cursor inside it
  const insertCodeBlock = (lang) => {
    const el = textareaRef.current
    if (!el) return
    const pos        = el.selectionStart
    const needsBreak = pos > 0 && form.content[pos - 1] !== '\n'
    const openFence  = (needsBreak ? '\n' : '') + '```' + lang + '\n'
    const block      = openFence + '\n```\n'
    const newContent = form.content.slice(0, pos) + block + form.content.slice(pos)
    setForm(f => ({ ...f, content: newContent }))
    requestAnimationFrame(() => {
      el.selectionStart = el.selectionEnd = pos + openFence.length
      el.focus()
    })
  }

  const toolbar = [
    { label: 'H2',   title: 'Heading 2',      action: () => insertBlock('## ') },
    { label: 'H3',   title: 'Heading 3',      action: () => insertBlock('### ') },
    { icon: <Bold size={13} />,   title: 'Bold',         action: () => insertMarkdown('**', '**') },
    { icon: <Italic size={13} />, title: 'Italic',       action: () => insertMarkdown('*', '*') },
    { icon: <Code size={13} />,   title: 'Inline code',  action: () => insertMarkdown('`', '`') },
    { label: 'YAML', title: 'YAML code block', action: () => insertCodeBlock('yaml') },
    { label: 'BASH', title: 'Bash code block', action: () => insertCodeBlock('bash') },
    { icon: <Quote size={13} />,  title: 'Blockquote',   action: () => insertBlock('> ') },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40">
      <div className="bg-white w-full sm:max-w-5xl rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col max-h-[95dvh]">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
          <h3 className="font-bold text-gray-900 truncate pr-4">{title}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors shrink-0">
            <X size={16} />
          </button>
        </div>

        {/* Title + Published row (always visible above the split) */}
        <div className="px-5 pt-4 pb-3 border-b border-gray-100 shrink-0 flex flex-col sm:flex-row sm:items-end gap-3">
          <div className="flex-1">
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">
              Page Title <span className="text-red-400">*</span>
            </label>
            <input
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              className="input-field text-sm w-full"
              placeholder="Step 1: Open your VSCode Server"
            />
          </div>
          <label className="flex items-center gap-2 cursor-pointer sm:pb-2 shrink-0">
            <input
              type="checkbox"
              checked={form.published}
              onChange={e => setForm(f => ({ ...f, published: e.target.checked }))}
              className="w-4 h-4 accent-indigo-700"
            />
            <span className="text-sm text-gray-700 font-medium whitespace-nowrap">Published</span>
          </label>
        </div>

        {/* Mobile write/preview tabs */}
        <div className="flex border-b border-gray-100 lg:hidden shrink-0">
          {['write', 'preview'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2.5 text-sm font-semibold capitalize transition-colors ${
                activeTab === tab
                  ? 'text-indigo-700 border-b-2 border-indigo-700 -mb-px'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Split content area */}
        <div className="flex-1 overflow-hidden flex lg:divide-x lg:divide-gray-100 min-h-0">

          {/* ── LEFT: Editor ── */}
          <div className={`flex flex-col flex-1 overflow-hidden lg:max-w-[50%] ${activeTab !== 'write' ? 'hidden lg:flex' : 'flex'}`}>

            {/* Toolbar */}
            <div className="flex flex-wrap items-center gap-1 px-4 py-2 border-b border-gray-100 bg-gray-50/80 shrink-0">
              {toolbar.map((btn, i) => (
                <button
                  key={i}
                  onMouseDown={e => { e.preventDefault(); btn.action() }}
                  title={btn.title}
                  className="flex items-center justify-center h-7 min-w-[28px] px-1.5 rounded text-gray-600 hover:text-gray-900 hover:bg-gray-200 transition-colors text-[11px] font-mono font-bold"
                >
                  {btn.icon || btn.label}
                </button>
              ))}
            </div>

            {/* Textarea */}
            <textarea
              ref={textareaRef}
              value={form.content}
              onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
              className="flex-1 w-full p-4 text-sm font-mono resize-none border-none outline-none focus:ring-0 leading-relaxed text-gray-800 bg-white min-h-0"
              placeholder={"## Step 1: Open VSCode\n\nNavigate to your assigned endpoint.\n\n```bash\ndocker ps\n```\n\n> **Tip:** Bookmark this URL.\n\nYour endpoint: ${docker-endpoint}"}
              spellCheck={false}
            />

            {/* Variable hint bar */}
            {credentialFields.length > 0 && (
              <div className="px-4 py-3 border-t border-gray-100 bg-indigo-50/70 shrink-0">
                <p className="text-[11px] font-semibold text-indigo-600 uppercase tracking-wide mb-2">
                  Click to insert variable
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {credentialFields.map(f => (
                    <button
                      key={f.name}
                      onMouseDown={e => { e.preventDefault(); insertAtCursor(`\${${f.name}}`) }}
                      title={`${f.label} (${f.type})`}
                      className="font-mono text-xs bg-white border border-indigo-200 text-indigo-700 px-2 py-1 rounded-md hover:bg-indigo-100 hover:border-indigo-400 transition-colors"
                    >
                      {`\${${f.name}}`}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── RIGHT: Preview ── */}
          <div className={`flex-1 overflow-y-auto lg:max-w-[50%] ${activeTab !== 'preview' ? 'hidden lg:block' : 'block'}`}>
            <div className="px-5 py-4">
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-4 hidden lg:block">
                Preview
              </p>

              {form.content ? (
                <PreviewMarkdown content={form.content} />
              ) : (
                <p className="text-sm text-gray-400 italic">Nothing to preview yet.</p>
              )}

              {/* Variable reference card in preview */}
              {credentialFields.length > 0 && (
                <div className="mt-8 rounded-xl overflow-hidden border border-indigo-100">
                  <div className="bg-indigo-700 px-4 py-2.5">
                    <p className="text-xs font-bold text-white">Dynamic Variables</p>
                    <p className="text-[11px] text-indigo-200 mt-0.5">Replaced with each user's credentials at runtime</p>
                  </div>
                  <div className="bg-indigo-50 divide-y divide-indigo-100">
                    {credentialFields.map(f => (
                      <div key={f.name} className="flex items-center justify-between px-4 py-2.5 text-xs">
                        <code className="text-indigo-700 font-mono font-semibold">{`\${${f.name}}`}</code>
                        <div className="text-right ml-4">
                          <span className="text-gray-700">{f.label}</span>
                          <span className="ml-1.5 text-gray-400">· {f.type}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 px-5 py-4 border-t border-gray-100 shrink-0">
          <button onClick={onClose} className="btn-secondary text-sm py-2 px-4">Cancel</button>
          <button onClick={onSave} disabled={saving || !form.title.trim()} className="btn-primary text-sm py-2 px-4 disabled:opacity-60">
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

// ── Markdown preview renderer (admin editor — no copy buttons needed) ──────────

function PreviewCodeBlock({ children }) {
  const child = Array.isArray(children) ? children[0] : children
  const lang  = child?.props?.className?.replace('language-', '') || ''
  const code  = String(child?.props?.children || '').replace(/\n$/, '')
  return (
    <div className="rounded-lg overflow-hidden border border-gray-700 my-4">
      {lang && (
        <div className="bg-gray-800 px-3 py-1.5 text-[10px] font-mono text-gray-400 uppercase tracking-wider">
          {lang}
        </div>
      )}
      <pre className="bg-gray-900 text-gray-100 px-4 py-3 overflow-x-auto text-xs font-mono leading-relaxed m-0">
        <code>{code}</code>
      </pre>
    </div>
  )
}

function PreviewMarkdown({ content }) {
  return (
    <ReactMarkdown
      components={{
        h1: ({ children }) => (
          <h1 className="text-xl font-bold text-gray-900 mt-6 mb-3 first:mt-0 leading-tight">{children}</h1>
        ),
        h2: ({ children }) => (
          <h2 className="text-base font-bold text-gray-900 mt-5 mb-2.5 pb-1.5 border-b border-gray-100">{children}</h2>
        ),
        h3: ({ children }) => (
          <h3 className="text-sm font-semibold text-gray-800 mt-4 mb-2">{children}</h3>
        ),
        p:  ({ children }) => (
          <p className="text-sm text-gray-700 leading-relaxed mb-3">{children}</p>
        ),
        ul: ({ children }) => (
          <ul className="list-disc pl-5 mb-3 space-y-1 text-sm text-gray-700">{children}</ul>
        ),
        ol: ({ children }) => (
          <ol className="list-decimal pl-5 mb-3 space-y-1 text-sm text-gray-700">{children}</ol>
        ),
        li: ({ children }) => <li className="leading-relaxed">{children}</li>,
        blockquote: ({ children }) => (
          <blockquote className="border-l-[3px] border-nutanix-700 pl-4 py-1 my-4 bg-nutanix-50 rounded-r-lg">
            <div className="text-sm text-nutanix-900 [&>p]:mb-0 [&>p]:mt-0">{children}</div>
          </blockquote>
        ),
        strong: ({ children }) => <strong className="font-semibold text-gray-900">{children}</strong>,
        em:     ({ children }) => <em className="italic text-gray-600">{children}</em>,
        a:      ({ children, href }) => (
          <a href={href} className="text-nutanix-700 hover:underline text-sm">{children}</a>
        ),
        pre:  PreviewCodeBlock,
        code: ({ children, className }) => {
          if (!className) return (
            <code className="bg-gray-100 text-nutanix-800 px-1.5 py-0.5 rounded text-[12px] font-mono border border-gray-200">
              {children}
            </code>
          )
          return <code className={className}>{children}</code>
        },
        hr: () => <hr className="border-gray-200 my-6" />,
      }}
    >
      {content}
    </ReactMarkdown>
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
