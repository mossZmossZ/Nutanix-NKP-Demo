import { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Menu, X, LogOut, ChevronDown } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'

const navItems = [
  { label: 'Home', to: '/' },
  { label: 'Installation', to: '/installation' },
  { label: 'Demo Portal', to: '/demo' },
  { label: 'Workshop', to: '/workshop' },
]

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Close mobile menu on route change
  useEffect(() => setMenuOpen(false), [location.pathname])

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <header
      className={`sticky top-0 z-50 w-full transition-all duration-200
        ${scrolled
          ? 'bg-white/90 backdrop-blur-md shadow-sm border-b border-gray-100'
          : 'bg-white border-b border-gray-100'
        }`}
    >
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 shrink-0 group">
          <div className="w-8 h-8 rounded-lg bg-nutanix-800 flex items-center justify-center
                          group-hover:bg-nutanix-700 transition-colors duration-150">
            <span className="text-white font-bold text-sm tracking-tight">N</span>
          </div>
          <div className="leading-none">
            <span className="font-bold text-gray-900 text-sm tracking-tight">Nutanix</span>
            <span className="text-nutanix-700 font-bold text-sm tracking-tight"> NKP</span>
          </div>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-6">
          {navItems.map(({ label, to }) => (
            <Link
              key={to}
              to={to}
              className={`nav-link ${location.pathname === to ? 'text-nutanix-800 after:w-full' : ''}`}
            >
              {label}
            </Link>
          ))}
        </div>

        {/* Desktop auth */}
        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <>
              <span className="text-sm text-gray-500 font-medium">{user.username}</span>
              <button
                onClick={handleLogout}
                className="btn-ghost text-sm py-1.5"
              >
                <LogOut size={14} />
                Sign out
              </button>
            </>
          ) : (
            <Link to="/demo" className="btn-primary text-sm py-2 px-5">
              Sign In
            </Link>
          )}
        </div>

        {/* Mobile toggle */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="md:hidden p-2 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors"
          aria-label="Toggle menu"
        >
          {menuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </nav>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white px-4 py-3 space-y-1">
          {navItems.map(({ label, to }) => (
            <Link
              key={to}
              to={to}
              className={`block px-3 py-2 rounded-lg text-sm font-medium transition-colors
                ${location.pathname === to
                  ? 'bg-nutanix-50 text-nutanix-800'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
            >
              {label}
            </Link>
          ))}
          <div className="pt-2 border-t border-gray-100 mt-2">
            {user ? (
              <button
                onClick={handleLogout}
                className="w-full text-left px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors flex items-center gap-2"
              >
                <LogOut size={14} /> Sign out ({user.username})
              </button>
            ) : (
              <Link to="/demo" className="btn-primary w-full text-sm py-2">Sign In</Link>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
