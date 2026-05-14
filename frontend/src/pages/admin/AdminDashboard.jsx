import { useState } from 'react'
import { Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Users, KeyRound, LogOut,
  Menu, X, ChevronRight, GraduationCap, BadgeCheck, Box,
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { confirm } from '@/lib/swal'
import Overview          from './Overview'
import UsersPage         from './Users'
import Credentials       from './Credentials'
import WorkshopsPage     from './Workshops'
import WorkshopCreds     from './WorkshopCredentials'
import ContainerLabs     from './ContainerLabs'

const navItems = [
  { label: 'Overview',         to: '/admin/dashboard',                       icon: LayoutDashboard },
  { label: 'Users',            to: '/admin/dashboard/users',                 icon: Users },
  { label: 'Demo Credentials', to: '/admin/dashboard/credentials',           icon: KeyRound },
  { label: 'Workshops',        to: '/admin/dashboard/workshops',             icon: GraduationCap },
  { label: 'Workshop Creds',   to: '/admin/dashboard/workshop-credentials',  icon: BadgeCheck },
  { label: 'Container Labs',   to: '/admin/dashboard/container-labs',        icon: Box },
]

export default function AdminDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = async () => {
    const result = await confirm('Sign out?', 'You will be returned to the admin login page.', 'Sign out')
    if (result.isConfirmed) { logout(); navigate('/admin') }
  }

  const currentPage = navItems.find(n => location.pathname === n.to || (n.to !== '/admin/dashboard' && location.pathname.startsWith(n.to)))?.label || 'Admin'

  return (
    // h-dvh handles mobile browser chrome (address bar shrinks/expands)
    <div className="flex h-dvh bg-gray-50 overflow-hidden">

      {/* ── Mobile overlay ───────────────────────────── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar ──────────────────────────────────── */}
      <aside
        className={`
          fixed md:static inset-y-0 left-0 z-30
          w-64 md:w-56 bg-nutanix-950 flex flex-col shrink-0
          transition-transform duration-200 ease-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
      >
        {/* Logo row */}
        <div className="h-14 flex items-center gap-2.5 px-4 border-b border-nutanix-900 shrink-0">
          <div className="w-7 h-7 rounded-md bg-nutanix-700 flex items-center justify-center shrink-0">
            <span className="text-white font-bold text-xs">N</span>
          </div>
          <div className="leading-none min-w-0">
            <p className="text-white font-bold text-sm truncate">NKP Admin</p>
            <p className="text-nutanix-500 text-xs truncate">Management Console</p>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="ml-auto md:hidden text-nutanix-500 hover:text-white p-1 shrink-0"
            aria-label="Close sidebar"
          >
            <X size={16} />
          </button>
        </div>

        {/* Nav links */}
        <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
          <p className="text-nutanix-600 text-xs font-semibold uppercase tracking-widest px-2 mb-2">
            Navigation
          </p>
          {navItems.map(({ label, to, icon: Icon }) => {
            const active = location.pathname === to
            return (
              <Link
                key={to}
                to={to}
                onClick={() => setSidebarOpen(false)}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
                  transition-colors duration-150
                  ${active
                    ? 'bg-nutanix-800 text-white'
                    : 'text-nutanix-400 hover:bg-nutanix-900 hover:text-white'
                  }
                `}
              >
                <Icon size={16} className="shrink-0" />
                <span className="truncate">{label}</span>
                {active && <ChevronRight size={13} className="ml-auto shrink-0 text-nutanix-500" />}
              </Link>
            )
          })}
        </nav>

        {/* User footer */}
        <div className="shrink-0 px-2 py-3 border-t border-nutanix-900">
          <div className="flex items-center gap-2.5 px-2 py-2">
            <div className="w-7 h-7 rounded-full bg-nutanix-700 flex items-center justify-center shrink-0">
              <span className="text-white text-xs font-bold">
                {user?.username?.[0]?.toUpperCase()}
              </span>
            </div>
            <p className="text-white text-xs font-semibold truncate flex-1 min-w-0">
              {user?.username}
            </p>
            <button
              onClick={handleLogout}
              className="text-nutanix-500 hover:text-white transition-colors p-1 rounded shrink-0"
              title="Sign out"
            >
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main area ────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Top header bar */}
        <header className="h-14 bg-white border-b border-gray-100 flex items-center gap-3 px-4 shrink-0">
          {/* Mobile menu button */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="md:hidden p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors shrink-0"
            aria-label="Open sidebar"
          >
            <Menu size={18} />
          </button>

          {/* Page title + breadcrumb */}
          <div className="min-w-0">
            <h1 className="font-bold text-gray-900 text-sm leading-none truncate">{currentPage}</h1>
            <p className="text-xs text-gray-400 mt-0.5 hidden sm:block">
              Admin / <span className="text-gray-600">{currentPage}</span>
            </p>
          </div>

          {/* Right: username badge */}
          <div className="ml-auto flex items-center gap-2 shrink-0">
            <span className="hidden sm:inline-flex badge bg-nutanix-50 text-nutanix-700 text-xs border border-nutanix-100">
              Admin
            </span>
            <span className="text-sm text-gray-500 truncate max-w-[100px]">{user?.username}</span>
          </div>
        </header>

        {/* Scrollable page content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <Routes>
            <Route index element={<Overview />} />
            <Route path="users" element={<UsersPage />} />
            <Route path="credentials" element={<Credentials />} />
            <Route path="workshops" element={<WorkshopsPage />} />
            <Route path="workshop-credentials" element={<WorkshopCreds />} />
            <Route path="container-labs" element={<ContainerLabs />} />
          </Routes>
        </main>
      </div>
    </div>
  )
}
