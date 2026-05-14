import { useState, useEffect, useRef } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Menu, X, LogOut } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const menuRef = useRef(null)
  const { user, logout, hasPortalAccess } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  // Smart portal links — go straight to dashboard when already authenticated
  const navItems = [
    { label: 'Home', to: '/' },
    { label: 'Installation', to: '/installation' },
    { label: 'Demo Portal', to: hasPortalAccess('demo') ? '/demo/dashboard' : '/demo' },
    { label: 'Workshop', to: hasPortalAccess('workshop') ? '/workshop/dashboard' : '/workshop' },
  ]

  // Scroll shadow
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Close mobile menu on route change
  useEffect(() => setMenuOpen(false), [location.pathname])

  // Animate mobile menu height
  useEffect(() => {
    const el = menuRef.current
    if (!el) return
    if (menuOpen) {
      el.style.maxHeight = el.scrollHeight + 'px'
    } else {
      el.style.maxHeight = '0px'
    }
  }, [menuOpen])

  const handleLogout = () => { logout(); navigate('/') }

  // Active check: exact match for '/', prefix match for everything else
  const isActive = (to) =>
    to === '/' ? location.pathname === '/' : location.pathname.startsWith(to)

  return (
    <header
      className={`sticky top-0 z-50 w-full transition-shadow duration-200
        bg-white border-b border-gray-100
        ${scrolled ? 'shadow-sm' : ''}`}
    >
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 md:h-16 flex items-center justify-between gap-4">

        {/* ── Logo ─────────────────────────────────── */}
        <Link to="/" className="flex items-center gap-2 shrink-0 group">
          <div className="w-7 h-7 md:w-8 md:h-8 rounded-lg bg-nutanix-800
                          group-hover:bg-nutanix-700 transition-colors duration-150
                          flex items-center justify-center">
            <span className="text-white font-bold text-xs md:text-sm tracking-tight">N</span>
          </div>
          <div className="leading-none hidden sm:block">
            <span className="font-bold text-gray-900 text-sm tracking-tight">NKP </span>
            <span className="text-nutanix-700 font-bold text-sm tracking-tight">DEMO</span>
          </div>
        </Link>

        {/* ── Desktop nav links ────────────────────── */}
        <div className="hidden md:flex items-center gap-1 lg:gap-2 flex-1 justify-center">
          {navItems.map(({ label, to }) => (
            <Link
              key={to}
              to={to}
              className={`
                nav-link px-2 lg:px-3 py-1 rounded text-sm whitespace-nowrap
                ${isActive(to) ? 'text-nutanix-800 after:w-full' : ''}
              `}
            >
              {label}
            </Link>
          ))}
        </div>

        {/* ── Desktop auth ─────────────────────────── */}
        <div className="hidden md:flex items-center gap-2 shrink-0">
          {user ? (
            <>
              <span className="text-sm text-gray-500 font-medium max-w-[120px] truncate">
                {user.username}
              </span>
              <button onClick={handleLogout} className="btn-ghost text-sm py-1.5 px-3">
                <LogOut size={14} />
                <span className="hidden lg:inline">Sign out</span>
              </button>
            </>
          ) : (
            <Link to="/admin" className="btn-primary text-sm py-2 px-4">
              Admin
            </Link>
          )}
        </div>

        {/* ── Mobile hamburger ─────────────────────── */}
        <button
          onClick={() => setMenuOpen(o => !o)}
          className="md:hidden p-2 rounded-lg text-gray-500
                     hover:text-gray-900 hover:bg-gray-100
                     transition-colors shrink-0"
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={menuOpen}
        >
          {menuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </nav>

      {/* ── Mobile menu (animated slide-down) ─────── */}
      <div
        ref={menuRef}
        className="md:hidden overflow-hidden transition-[max-height] duration-200 ease-out"
        style={{ maxHeight: 0 }}
      >
        <div className="border-t border-gray-100 bg-white px-4 pt-2 pb-3 space-y-0.5">
          {navItems.map(({ label, to }) => (
            <Link
              key={to}
              to={to}
              className={`
                flex items-center px-3 py-2.5 rounded-lg text-sm font-medium
                transition-colors duration-150
                ${isActive(to)
                  ? 'bg-nutanix-50 text-nutanix-800'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }
              `}
            >
              {label}
            </Link>
          ))}

          <div className="pt-2 mt-1 border-t border-gray-100">
            {user ? (
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg
                           text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900
                           transition-colors duration-150"
              >
                <LogOut size={14} />
                Sign out
                <span className="ml-auto text-xs text-gray-400 truncate max-w-[120px]">
                  {user.username}
                </span>
              </button>
            ) : (
              <Link
                to="/admin"
                className="btn-primary w-full text-sm py-2.5 justify-center"
              >
                Admin
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
