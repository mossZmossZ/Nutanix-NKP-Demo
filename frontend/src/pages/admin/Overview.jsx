import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Users, Monitor, GraduationCap, KeyRound, ArrowRight, BookOpen, BadgeCheck, Box } from 'lucide-react'
import api from '@/lib/api'

export default function Overview() {
  const [stats, setStats]     = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/admin/stats')
      .then(r => setStats(r.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const cards = stats ? [
    { icon: Users,         label: 'Total Users',         value: stats.totalUsers,       color: 'text-blue-600',    bg: 'bg-blue-50',    border: 'border-blue-100' },
    { icon: Monitor,       label: 'Demo Portal Users',   value: stats.demoUsers,        color: 'text-nutanix-700', bg: 'bg-nutanix-50', border: 'border-nutanix-100' },
    { icon: GraduationCap, label: 'Workshop Users',      value: stats.workshopUsers,    color: 'text-indigo-600',  bg: 'bg-indigo-50',  border: 'border-indigo-100' },
    { icon: KeyRound,      label: 'Demo Credentials',    value: stats.totalCredentials, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' },
    { icon: BookOpen,      label: 'Active Workshops',    value: stats.totalWorkshops,   color: 'text-violet-600',  bg: 'bg-violet-50',  border: 'border-violet-100' },
    { icon: BadgeCheck,    label: 'Published Lab Steps', value: stats.totalPages,       color: 'text-amber-600',   bg: 'bg-amber-50',   border: 'border-amber-100' },
  ] : []

  return (
    <div className="w-full space-y-5">
      <div>
        <h2 className="text-lg font-bold text-gray-900">Overview</h2>
        <p className="text-sm text-gray-500 mt-0.5">Platform summary at a glance.</p>
      </div>

      {/* Stats grid — 2 cols on mobile, 3 on md, 6 on xl */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 md:gap-4">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-100 p-4 animate-pulse">
                <div className="w-8 h-8 bg-gray-100 rounded-lg mb-3" />
                <div className="h-6 bg-gray-100 rounded w-10 mb-1" />
                <div className="h-3 bg-gray-100 rounded w-20" />
              </div>
            ))
          : cards.map(({ icon: Icon, label, value, color, bg, border }) => (
              <div key={label} className={`bg-white rounded-xl border ${border} p-4`}>
                <div className={`w-8 h-8 ${bg} rounded-lg flex items-center justify-center mb-3`}>
                  <Icon size={16} className={color} />
                </div>
                <p className="text-2xl font-bold text-gray-900 leading-none">{value ?? '—'}</p>
                <p className="text-xs text-gray-500 mt-1 leading-tight">{label}</p>
              </div>
            ))
        }
      </div>

      {/* Quick actions */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-50">
          <h3 className="text-sm font-semibold text-gray-900">Quick Actions</h3>
        </div>
        <QuickAction
          icon={<Users size={15} className="text-nutanix-600" />}
          label="Manage Users"
          desc="Create, edit, and control portal access for users."
          to="/admin/dashboard/users"
        />
        <QuickAction
          icon={<KeyRound size={15} className="text-emerald-600" />}
          label="Demo Credentials"
          desc="Add cluster credentials and kubeconfig files for the Demo Portal."
          to="/admin/dashboard/credentials"
        />
        <QuickAction
          icon={<BookOpen size={15} className="text-violet-600" />}
          label="Manage Workshops"
          desc="Create workshops, write lab steps, and manage credential fields."
          to="/admin/dashboard/workshops"
        />
        <QuickAction
          icon={<BadgeCheck size={15} className="text-amber-600" />}
          label="Workshop Credentials"
          desc="Assign per-user lab credentials (VSCode, registry, etc.)."
          to="/admin/dashboard/workshop-credentials"
        />
        <QuickAction
          icon={<Box size={15} className="text-sky-600" />}
          label="Container Labs"
          desc="Provision isolated lab containers with code-server, Docker, and kubectl."
          to="/admin/dashboard/container-labs"
        />
      </div>
    </div>
  )
}

function QuickAction({ icon, label, desc, to }) {
  return (
    <Link
      to={to}
      className="flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 transition-colors duration-150 group border-b border-gray-50 last:border-0"
    >
      <div className="w-8 h-8 bg-gray-50 group-hover:bg-white rounded-lg flex items-center justify-center border border-gray-100 shrink-0 transition-colors">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900 truncate">{label}</p>
        <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{desc}</p>
      </div>
      <ArrowRight size={14} className="text-gray-300 group-hover:text-nutanix-600 group-hover:translate-x-0.5 transition-all duration-150 shrink-0" />
    </Link>
  )
}
