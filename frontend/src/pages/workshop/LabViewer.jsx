import { useState, useEffect, useRef, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import {
  CheckCircle, Circle, ChevronLeft, ChevronRight,
  X, Menu, Copy, Check, Eye, EyeOff, ArrowLeft, KeyRound, Trophy,
} from 'lucide-react'
import api from '@/lib/api'
import { toastSuccess, toastError } from '@/lib/swal'

export default function LabViewer() {
  const { workshopId } = useParams()
  const navigate = useNavigate()

  const [workshop, setWorkshop]             = useState(null)
  const [pages, setPages]                   = useState([])
  const [currentPage, setCurrentPage]       = useState(null)
  const [currentContent, setCurrentContent] = useState('')
  const [completedPages, setCompletedPages] = useState(new Set())
  const [credentials, setCredentials]       = useState(null)
  const [workshopFields, setWorkshopFields] = useState([])
  const [sidebarOpen, setSidebarOpen]       = useState(false)
  const [loading, setLoading]               = useState(true)
  const [pageLoading, setPageLoading]       = useState(false)
  const [marking, setMarking]               = useState(false)
  const [autoAdvancing, setAutoAdvancing]   = useState(false)

  const autoTimer = useRef(null)

  // ── Cancel pending auto-advance ───────────────────────────────────────────
  const cancelAutoAdvance = () => {
    if (autoTimer.current) {
      clearTimeout(autoTimer.current)
      autoTimer.current = null
      setAutoAdvancing(false)
    }
  }

  useEffect(() => () => cancelAutoAdvance(), [])

  // ── Initial data load ─────────────────────────────────────────────────────
  useEffect(() => {
    Promise.all([
      api.get(`/workshop/${workshopId}`),
      api.get(`/workshop/${workshopId}/my-credentials`),
      api.get(`/workshop/${workshopId}/progress`),
    ]).then(([wsRes, credRes, progressRes]) => {
      const ws        = wsRes.data
      const pagesList = ws.pages || []
      setWorkshop(ws)
      setPages(pagesList)
      setWorkshopFields(ws.credentialFields || [])
      setCredentials(credRes.data)
      setCompletedPages(new Set((progressRes.data.completedPages || []).map(String)))

      if (pagesList.length > 0) {
        setCurrentPage(pagesList[0])
        setPageLoading(true)
        api.get(`/workshop/${workshopId}/pages/${pagesList[0]._id}`)
          .then(r => setCurrentContent(r.data.content || ''))
          .catch(() => setCurrentContent(''))
          .finally(() => setPageLoading(false))
      }
    }).catch(() => {
      toastError('Failed to load workshop')
      navigate('/workshop/dashboard')
    }).finally(() => setLoading(false))
  }, [workshopId, navigate])

  // ── Page selection (cancels any pending auto-advance) ─────────────────────
  const selectPage = async (page) => {
    cancelAutoAdvance()
    if (page._id === currentPage?._id) { setSidebarOpen(false); return }
    setCurrentPage(page)
    setSidebarOpen(false)
    setPageLoading(true)
    try {
      const res = await api.get(`/workshop/${workshopId}/pages/${page._id}`)
      setCurrentContent(res.data.content || '')
    } catch {
      setCurrentContent('')
    } finally {
      setPageLoading(false)
    }
  }

  // ── Merge template + per-user values into one list ───────────────────────
  const credFieldsFull = useMemo(() =>
    (workshopFields || []).map(f => ({
      ...f,
      value: credentials?.fields?.find(cf => cf.name === f.name)?.value || '',
    })),
    [workshopFields, credentials]
  )

  // ── Pre-process markdown: inline vars → interactive `$name`, code blocks → actual values
  const preparedContent = useMemo(
    () => prepareContent(currentContent, credFieldsFull),
    [currentContent, credFieldsFull]
  )

  // ── Derived state ─────────────────────────────────────────────────────────
  const currentIndex   = pages.findIndex(p => p._id === currentPage?._id)
  const totalPages     = pages.length
  const completedCount = completedPages.size
  const progress       = totalPages > 0 ? Math.round((completedCount / totalPages) * 100) : 0
  const isCompleted    = currentPage && completedPages.has(String(currentPage._id))
  const allDone        = progress === 100 && totalPages > 0

  const goNext = () => { if (currentIndex < pages.length - 1) selectPage(pages[currentIndex + 1]) }
  const goPrev = () => { if (currentIndex > 0) selectPage(pages[currentIndex - 1]) }

  // Manual navigation buttons also cancel pending auto-advance
  const handleNext = () => { cancelAutoAdvance(); goNext() }
  const handlePrev = () => { cancelAutoAdvance(); goPrev() }

  // ── Mark complete with auto-advance ───────────────────────────────────────
  const toggleComplete = async () => {
    if (!currentPage || marking) return
    const pageId = currentPage._id
    const done   = completedPages.has(String(pageId))

    if (done) cancelAutoAdvance()

    setMarking(true)
    try {
      await api.post(`/workshop/${workshopId}/progress`, { pageId, completed: !done })
      setCompletedPages(prev => {
        const next = new Set(prev)
        done ? next.delete(String(pageId)) : next.add(String(pageId))
        return next
      })
      if (!done) {
        toastSuccess('Step complete!')
        // Auto-advance to next step if one exists
        if (currentIndex < pages.length - 1) {
          setAutoAdvancing(true)
          autoTimer.current = setTimeout(() => {
            autoTimer.current = null
            setAutoAdvancing(false)
            goNext()
          }, 1500)
        }
      }
    } catch {
      toastError('Failed to update progress')
    } finally {
      setMarking(false)
    }
  }

  // ── Loading state ─────────────────────────────────────────────────────────
  if (loading) return (
    <div className="flex items-center justify-center h-screen bg-gray-50">
      <div className="w-8 h-8 border-4 border-nutanix-700 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/40 z-20 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* ── Sidebar ────────────────────────────────────── */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-30
        w-72 bg-[#fafafa] border-r border-gray-100 flex flex-col shrink-0
        transition-transform duration-200
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>

        {/* Logo / back row */}
        <div className="h-14 flex items-center gap-2 px-3 bg-white border-b border-gray-100 shrink-0">
          <button
            onClick={() => navigate('/workshop/dashboard')}
            className="p-1.5 rounded-lg text-gray-400 hover:text-nutanix-700 hover:bg-nutanix-50 transition-colors shrink-0"
            title="Back to workshops"
          >
            <ArrowLeft size={16} />
          </button>
          <p className="font-bold text-gray-900 text-sm truncate flex-1 px-1 leading-tight">{workshop?.title}</p>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 shrink-0">
            <X size={16} />
          </button>
        </div>

        {/* Progress summary */}
        <div className="px-4 py-3 bg-white border-b border-gray-100 shrink-0">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-gray-500">{completedCount} of {totalPages} steps</span>
            <span className={`font-bold ${allDone ? 'text-emerald-600' : 'text-nutanix-700'}`}>{progress}%</span>
          </div>
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${allDone ? 'bg-emerald-500' : 'bg-nutanix-700'}`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Step list */}
        <nav className="flex-1 overflow-y-auto py-2">
          {pages.map((page, idx) => {
            const done   = completedPages.has(String(page._id))
            const active = page._id === currentPage?._id
            return (
              <button
                key={page._id}
                onClick={() => selectPage(page)}
                className={`w-full flex items-start gap-3 px-4 py-3 text-left transition-all duration-150
                  ${active
                    ? 'bg-white border-r-[3px] border-nutanix-700 shadow-sm'
                    : 'hover:bg-white/70'
                  }
                `}
              >
                {/* Step icon */}
                <div className={`mt-0.5 shrink-0 transition-colors ${done ? 'text-emerald-500' : active ? 'text-nutanix-700' : 'text-gray-300'}`}>
                  {done
                    ? <CheckCircle size={18} />
                    : <div className={`w-[18px] h-[18px] rounded-full border-2 flex items-center justify-center text-[10px] font-bold ${active ? 'border-nutanix-700 text-nutanix-700' : 'border-gray-300 text-gray-400'}`}>
                        {idx + 1}
                      </div>
                  }
                </div>
                <div className="min-w-0 flex-1">
                  <span className={`text-sm font-medium leading-snug block ${active ? 'text-gray-900' : done ? 'text-gray-500' : 'text-gray-600'}`}>
                    {page.title}
                  </span>
                </div>
              </button>
            )
          })}
        </nav>
      </aside>

      {/* ── Main area ──────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Top bar */}
        <header className="h-14 bg-white border-b border-gray-100 flex items-center gap-3 px-4 shrink-0">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-1.5 rounded-lg text-gray-500 hover:bg-gray-100">
            <Menu size={18} />
          </button>
          <div className="flex-1 min-w-0">
            {currentPage && (
              <>
                <p className="font-semibold text-gray-900 text-sm truncate leading-tight">{currentPage.title}</p>
                <p className="text-xs text-gray-400 mt-0.5">Step {currentIndex + 1} of {totalPages} · {progress}% complete</p>
              </>
            )}
          </div>
          <button
            onClick={() => navigate('/workshop/dashboard')}
            className="hidden sm:flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-700 transition-colors shrink-0 py-1.5 px-3 rounded-lg hover:bg-gray-50"
          >
            <ArrowLeft size={14} /> Exit Lab
          </button>
        </header>

        {/* Scrollable content */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto px-4 sm:px-8 py-8 pb-4">

            {pageLoading ? (
              <div className="space-y-4 animate-pulse">
                <div className="h-8 bg-gray-100 rounded-lg w-2/3" />
                {[...Array(7)].map((_, i) => (
                  <div key={i} className="h-4 bg-gray-100 rounded" style={{ width: `${60 + (i % 4) * 10}%` }} />
                ))}
              </div>
            ) : (
              <>
                {/* ── Workshop completion banner ───────────── */}
                {allDone && (
                  <div className="mb-8 rounded-2xl overflow-hidden shadow-sm">
                    <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 px-6 py-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                        <Trophy size={24} className="text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-white font-bold text-lg leading-tight">Workshop Complete!</h3>
                        <p className="text-emerald-100 text-sm mt-0.5">
                          You've finished all {totalPages} steps. Excellent work!
                        </p>
                      </div>
                      <button
                        onClick={() => navigate('/workshop/dashboard')}
                        className="shrink-0 bg-white text-emerald-700 font-bold text-sm py-2.5 px-5 rounded-xl hover:bg-emerald-50 transition-colors whitespace-nowrap"
                      >
                        Back to Courses
                      </button>
                    </div>
                  </div>
                )}

                {/* ── Credentials panel (top) ─────────────── */}
                {credFieldsFull.length > 0 && (
                  <CredentialsPanel credFields={credFieldsFull} />
                )}

                {/* ── Markdown content with interactive inline variables ── */}
                <MarkdownContent content={preparedContent} credFields={credFieldsFull} />
              </>
            )}
          </div>
        </main>

        {/* ── Sticky bottom navigation (Coursera-style) ── */}
        <nav className="shrink-0 bg-white border-t border-gray-100 px-4 sm:px-8 py-4">
          <div className="max-w-3xl mx-auto flex items-center justify-between gap-3">

            {/* Previous */}
            <button
              onClick={handlePrev}
              disabled={currentIndex === 0}
              className="btn-secondary text-sm py-2.5 px-5 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={16} /> Previous
            </button>

            {/* Mark complete */}
            <button
              onClick={toggleComplete}
              disabled={marking}
              className={`text-sm py-2.5 px-5 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2 min-w-[11rem] ${
                isCompleted
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                  : 'bg-nutanix-700 text-white hover:bg-nutanix-800 shadow-sm'
              }`}
            >
              {marking
                ? <span className="w-4 h-4 border-2 border-current/40 border-t-current rounded-full animate-spin" />
                : isCompleted
                  ? <><CheckCircle size={15} /> Completed</>
                  : <><Circle size={15} /> Mark Complete</>
              }
            </button>

            {/* Next — shows advancing state during countdown */}
            <button
              onClick={handleNext}
              disabled={currentIndex === pages.length - 1 && !autoAdvancing}
              className={`btn-primary text-sm py-2.5 px-5 disabled:opacity-30 disabled:cursor-not-allowed transition-all ${
                autoAdvancing ? 'ring-2 ring-nutanix-400 ring-offset-2 animate-pulse-slow' : ''
              }`}
            >
              {autoAdvancing
                ? <><ChevronRight size={16} className="animate-bounce" /> Advancing…</>
                : <>Next <ChevronRight size={16} /></>
              }
            </button>

          </div>
        </nav>

      </div>
    </div>
  )
}

// ── Markdown renderer ─────────────────────────────────────────────────────────

function MarkdownContent({ content, credFields = [] }) {
  const credLookup = Object.fromEntries(credFields.map(f => [f.name, f]))

  return (
    <ReactMarkdown
      components={{
        h1: ({ children }) => (
          <h1 className="text-[1.75rem] font-bold text-gray-900 mt-10 mb-5 first:mt-0 leading-tight tracking-tight">
            {children}
          </h1>
        ),
        h2: ({ children }) => (
          <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4 pb-2 border-b border-gray-100 leading-snug">
            {children}
          </h2>
        ),
        h3: ({ children }) => (
          <h3 className="text-base font-semibold text-gray-900 mt-6 mb-3 leading-snug">{children}</h3>
        ),
        p:  ({ children }) => (
          <p className="text-[15px] text-gray-700 leading-[1.75] mb-5">{children}</p>
        ),
        ul: ({ children }) => (
          <ul className="list-disc pl-6 mb-5 space-y-2 text-[15px] text-gray-700">{children}</ul>
        ),
        ol: ({ children }) => (
          <ol className="list-decimal pl-6 mb-5 space-y-2 text-[15px] text-gray-700">{children}</ol>
        ),
        li: ({ children }) => <li className="leading-[1.7]">{children}</li>,
        a:  ({ children, href }) => (
          <a href={href} target="_blank" rel="noreferrer"
            className="text-nutanix-700 hover:text-nutanix-800 underline underline-offset-2 decoration-nutanix-300 hover:decoration-nutanix-600 transition-colors">
            {children}
          </a>
        ),
        blockquote: ({ children }) => (
          <blockquote className="border-l-[3px] border-nutanix-700 pl-5 py-1 my-6 bg-nutanix-50 rounded-r-xl">
            <div className="text-[15px] text-nutanix-900 leading-relaxed [&>p]:mb-0 [&>p]:mt-0">{children}</div>
          </blockquote>
        ),
        strong: ({ children }) => <strong className="font-semibold text-gray-900">{children}</strong>,
        em:     ({ children }) => <em className="italic text-gray-600">{children}</em>,
        hr:     () => <hr className="border-gray-200 my-10" />,
        pre:    PreBlock,
        code: ({ children, className }) => {
          const text = String(children)
          // `$fieldname` → interactive credential widget
          if (!className && text.startsWith('$')) {
            const field = credLookup[text.slice(1)]
            if (field) return <CredentialInline field={field} />
          }
          if (!className) return (
            <code className="bg-gray-100 text-nutanix-800 px-1.5 py-0.5 rounded-md text-[13px] font-mono border border-gray-200">
              {children}
            </code>
          )
          return <code className={className}>{children}</code>
        },
      }}
    >
      {content}
    </ReactMarkdown>
  )
}

function PreBlock({ children }) {
  const child = Array.isArray(children) ? children[0] : children
  const lang  = child?.props?.className?.replace('language-', '') || ''
  const code  = String(child?.props?.children || '').replace(/\n$/, '')
  return <CodeBlock lang={lang} code={code} />
}

function CodeBlock({ lang, code }) {
  const [copied, setCopied] = useState(false)

  const copy = () => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="rounded-xl overflow-hidden border border-gray-200 my-6 shadow-sm">
      {/* Language bar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-gray-800 border-b border-gray-700">
        <span className="text-xs font-mono text-gray-400 uppercase tracking-widest">{lang || 'code'}</span>
        <button
          onClick={copy}
          className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors py-0.5 px-2 rounded hover:bg-white/10"
        >
          {copied
            ? <><Check size={11} className="text-emerald-400" /> Copied!</>
            : <><Copy size={11} /> Copy</>
          }
        </button>
      </div>
      {/* Code body */}
      <pre className="bg-gray-900 text-gray-100 p-5 overflow-x-auto text-[13px] font-mono leading-relaxed m-0">
        <code>{code}</code>
      </pre>
    </div>
  )
}

// ── Credentials panel (top of page) ──────────────────────────────────────────

function CredentialsPanel({ credFields }) {
  const [revealed, setRevealed] = useState({})
  const [copied, setCopied]     = useState({})

  const toggle = (name) => setRevealed(p => ({ ...p, [name]: !p[name] }))
  const copy   = (name, value) => {
    navigator.clipboard.writeText(value || '')
    setCopied(p => ({ ...p, [name]: true }))
    setTimeout(() => setCopied(p => ({ ...p, [name]: false })), 2000)
  }

  const visible = credFields.filter(f => f.value)
  if (!visible.length) return null

  return (
    <div className="mb-8 rounded-2xl border border-nutanix-100 overflow-hidden shadow-sm">
      <div className="flex items-center gap-2.5 px-5 py-3.5 bg-nutanix-700">
        <KeyRound size={15} className="text-nutanix-200 shrink-0" />
        <span className="text-sm font-semibold text-white">Your Lab Credentials</span>
        <span className="ml-auto text-xs text-nutanix-300 tabular-nums">
          {visible.length} field{visible.length !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="divide-y divide-gray-100 bg-white">
        {visible.map(f => {
          const isPassword = f.type === 'password'
          const isUrl      = f.type === 'url'
          const isRevealed = revealed[f.name]
          const isCopied   = copied[f.name]

          return (
            <div key={f.name} className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50 transition-colors">
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1">
                  {f.label || f.name}
                </p>
                {isPassword ? (
                  <p className="text-sm font-mono text-gray-900 break-all select-all">
                    {isRevealed ? f.value : '•'.repeat(Math.min(f.value.length || 12, 24))}
                  </p>
                ) : isUrl ? (
                  <a href={f.value} target="_blank" rel="noreferrer"
                    className="text-sm text-nutanix-700 hover:underline break-all font-medium">
                    {f.value}
                  </a>
                ) : (
                  <p className="text-sm font-mono text-gray-900 break-all select-all">{f.value}</p>
                )}
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {isPassword && (
                  <button onClick={() => toggle(f.name)}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                    title={isRevealed ? 'Hide' : 'Reveal'}>
                    {isRevealed ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                )}
                <button onClick={() => copy(f.name, f.value)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-nutanix-700 hover:bg-nutanix-50 transition-colors"
                  title="Copy">
                  {isCopied ? <Check size={15} className="text-emerald-500" /> : <Copy size={15} />}
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Interactive inline credential widget ──────────────────────────────────────

function CredentialInline({ field }) {
  const [revealed, setRevealed] = useState(false)
  const [copied, setCopied]     = useState(false)

  const { type, value = '' } = field
  const isPassword = type === 'password'
  const isUrl      = type === 'url'

  const copy = () => {
    navigator.clipboard.writeText(value)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const display = isPassword
    ? (revealed ? value : '•'.repeat(Math.min(value.length || 8, 16)))
    : value

  return (
    <span className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 font-mono text-[13px] align-middle mx-0.5 border leading-none ${
      isPassword
        ? 'bg-amber-50 border-amber-200 text-amber-900'
        : isUrl
          ? 'bg-blue-50 border-blue-200 text-blue-800'
          : 'bg-nutanix-50 border-nutanix-200 text-nutanix-900'
    }`}>
      <span className="select-all">
        {isUrl
          ? <a href={value} target="_blank" rel="noreferrer" className="hover:underline">{display}</a>
          : display
        }
      </span>
      {isPassword && (
        <button onClick={() => setRevealed(r => !r)}
          className="shrink-0 text-amber-400 hover:text-amber-700 transition-colors leading-none p-px"
          title={revealed ? 'Hide' : 'Reveal'}>
          {revealed ? <EyeOff size={11} /> : <Eye size={11} />}
        </button>
      )}
      <button onClick={copy}
        className={`shrink-0 transition-colors leading-none p-px ${
          isPassword ? 'text-amber-400 hover:text-amber-700'
          : isUrl    ? 'text-blue-400 hover:text-blue-700'
          :            'text-nutanix-400 hover:text-nutanix-700'
        }`}
        title="Copy">
        {copied ? <Check size={11} className="text-emerald-500" /> : <Copy size={11} />}
      </button>
    </span>
  )
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

// Line-by-line pre-processing:
// • Inside fenced code blocks  → substitute actual credential values (so copy gives ready-to-run commands)
// • Outside code blocks        → convert ${name} to `$name` (triggers CredentialInline renderer)
function prepareContent(content, credFields) {
  if (!credFields?.length || !content) return content

  const fieldMap = Object.fromEntries(credFields.map(f => [f.name, f]))
  const names    = credFields.map(f => f.name)
  if (!names.length) return content

  const pattern = new RegExp(`\\$\\{(${names.map(escapeRegex).join('|')})\\}`, 'g')

  let inCodeBlock = false
  return content.split('\n').map(line => {
    if (line.trimStart().startsWith('```')) {
      inCodeBlock = !inCodeBlock
      return line
    }
    if (inCodeBlock) {
      // Substitute actual values so the copied code is ready to run
      return line.replace(pattern, (_, name) => fieldMap[name]?.value || `\${${name}}`)
    }
    // Outside code: convert to inline code marker that CredentialInline detects
    return line.replace(pattern, (_, name) => `\`$${name}\``)
  }).join('\n')
}
