import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { GraduationCap, Play, BarChart3, Clock, CheckCircle } from 'lucide-react'
import api from '@/lib/api'

export default function WorkshopDashboard() {
  const { user }    = useAuth()
  const navigate    = useNavigate()
  const [workshops, setWorkshops] = useState([])
  const [progress, setProgress]   = useState({})
  const [loading, setLoading]     = useState(true)

  useEffect(() => {
    Promise.all([
      api.get('/workshop'),
      api.get('/workshop/my-progress'),
    ]).then(([wsRes, progressRes]) => {
      setWorkshops(wsRes.data)
      setProgress(progressRes.data)
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-white rounded-2xl border border-gray-100 p-6 animate-pulse space-y-3">
            <div className="h-5 bg-gray-100 rounded w-32" />
            <div className="h-4 bg-gray-100 rounded w-full" />
            <div className="h-2 bg-gray-100 rounded-full w-full mt-4" />
          </div>
        ))}
      </div>
    </div>
  )

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8 pb-6 border-b border-gray-200">
        <div className="w-12 h-12 bg-gradient-to-br from-indigo-700 to-nutanix-700 rounded-xl flex items-center justify-center shrink-0">
          <GraduationCap size={24} className="text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Workshop Portal</h1>
          <p className="text-gray-500 text-sm">
            Welcome back, <span className="font-medium text-nutanix-700">{user?.username}</span>
          </p>
        </div>
      </div>

      {workshops.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 py-24 text-center">
          <GraduationCap size={48} className="text-gray-200 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">No workshops available yet</h3>
          <p className="text-sm text-gray-400">Check back later or contact your instructor.</p>
        </div>
      ) : (
        <>
          {/* ── "Continue where you left off" hero ── */}
          {(() => {
            const inProgress = workshops.find(ws => {
              const done  = progress[ws._id] || 0
              const total = ws.totalPages   || 0
              return done > 0 && done < total
            })
            if (!inProgress) return null
            const done  = progress[inProgress._id] || 0
            const total = inProgress.totalPages    || 0
            const pct   = total > 0 ? Math.round((done / total) * 100) : 0
            return (
              <div className="mb-8 rounded-2xl overflow-hidden shadow-md">
                <div className="bg-gradient-to-r from-indigo-700 via-indigo-600 to-nutanix-700 px-6 py-5 flex flex-col sm:flex-row items-start sm:items-center gap-5">
                  <div className="w-14 h-14 rounded-2xl bg-white/15 flex items-center justify-center shrink-0">
                    <Play size={26} className="text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-indigo-200 text-xs font-semibold uppercase tracking-widest mb-1">
                      Continue where you left off
                    </p>
                    <h3 className="font-bold text-white text-xl leading-tight truncate">{inProgress.title}</h3>
                    <div className="flex items-center gap-3 mt-2">
                      <div className="flex-1 h-1.5 bg-white/20 rounded-full overflow-hidden">
                        <div className="h-full bg-white rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-indigo-200 text-xs shrink-0 font-medium">{done}/{total} steps · {pct}%</span>
                    </div>
                  </div>
                  <button
                    onClick={() => navigate(`/workshop/${inProgress._id}/lab`)}
                    className="shrink-0 w-full sm:w-auto bg-white text-indigo-700 font-bold text-sm py-3 px-7 rounded-xl hover:bg-indigo-50 transition-colors flex items-center justify-center gap-2"
                  >
                    <Play size={15} /> Resume
                  </button>
                </div>
              </div>
            )
          })()}

          <p className="text-sm text-gray-500 mb-6">
            {workshops.length} workshop{workshops.length !== 1 ? 's' : ''} available
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {workshops.map(ws => {
              const completed = progress[ws._id] || 0
              const total     = ws.totalPages || 0
              const pct       = total > 0 ? Math.round((completed / total) * 100) : 0
              return (
                <WorkshopCard
                  key={ws._id}
                  workshop={ws}
                  completed={completed}
                  total={total}
                  pct={pct}
                  onClick={() => navigate(`/workshop/${ws._id}/lab`)}
                />
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}

function WorkshopCard({ workshop, completed, total, pct, onClick }) {
  const started  = completed > 0
  const finished = pct === 100

  return (
    <button
      onClick={onClick}
      className="group bg-white rounded-2xl border border-gray-100 hover:border-indigo-200 hover:shadow-lg transition-all duration-300 overflow-hidden text-left flex flex-col w-full"
    >
      <div className="h-1.5 bg-gradient-to-r from-indigo-700 to-nutanix-600 shrink-0" />

      <div className="p-6 flex flex-col flex-1 gap-4">
        {/* Icon + title */}
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0 group-hover:bg-indigo-100 transition-colors">
            <GraduationCap size={22} className="text-indigo-700" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-bold text-gray-900 text-base leading-snug group-hover:text-indigo-700 transition-colors">
              {workshop.title}
            </h3>
            {workshop.description && (
              <p className="text-sm text-gray-500 mt-1 line-clamp-2">{workshop.description}</p>
            )}
          </div>
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-4 text-xs text-gray-400">
          <span className="flex items-center gap-1.5"><BarChart3 size={12} /> {total} steps</span>
          {started && !finished && (
            <span className="flex items-center gap-1.5 text-indigo-600"><Clock size={12} /> In progress</span>
          )}
          {finished && (
            <span className="flex items-center gap-1.5 text-emerald-600"><CheckCircle size={12} /> Completed</span>
          )}
        </div>

        {/* Progress */}
        <div className="mt-auto">
          <div className="flex items-center justify-between text-xs text-gray-500 mb-1.5">
            <span>{completed}/{total} completed</span>
            <span className={`font-bold ${finished ? 'text-emerald-600' : 'text-indigo-700'}`}>{pct}%</span>
          </div>
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${finished ? 'bg-emerald-500' : 'bg-indigo-600'}`}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        {/* CTA */}
        <div className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
          finished
            ? 'bg-emerald-50 text-emerald-700 group-hover:bg-emerald-100'
            : started
              ? 'bg-indigo-50 text-indigo-700 group-hover:bg-indigo-100'
              : 'bg-nutanix-700 text-white group-hover:bg-nutanix-800'
        }`}>
          <Play size={15} />
          {finished ? 'Review Lab' : started ? 'Continue Lab' : 'Start Lab'}
        </div>
      </div>
    </button>
  )
}
