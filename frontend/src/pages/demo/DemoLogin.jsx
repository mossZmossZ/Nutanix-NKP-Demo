import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Eye, EyeOff, LogIn, CheckCircle, Server } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'

const panelFeatures = [
  'Access live cluster credentials',
  'Download YAML templates',
  'Follow guided walkthroughs',
  'Real NKP demo environment',
]

export default function DemoLogin() {
  const [form, setForm] = useState({ username: '', password: '' })
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login, user, loading: authLoading, hasPortalAccess } = useAuth()
  const navigate = useNavigate()

  // Already authenticated — skip the form
  useEffect(() => {
    if (!authLoading && user && hasPortalAccess('demo')) {
      navigate('/demo/dashboard', { replace: true })
    }
  }, [authLoading, user])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const user = await login(form.username, form.password)
      if (user.portalAccess?.includes('demo') || user.role === 'admin') {
        navigate('/demo/dashboard')
      } else {
        setError('Your account does not have access to the Demo Portal.')
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid credentials. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex">
      {/* ── Left brand panel ─────────────────────────── */}
      <div className="hidden lg:flex lg:w-[45%] bg-nutanix-950 flex-col justify-between p-12 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-nutanix-800/30 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-nutanix-700/20 rounded-full translate-y-1/2 -translate-x-1/2 blur-2xl" />

        {/* Logo */}
        <div className="relative flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-nutanix-700 flex items-center justify-center">
            <span className="text-white font-bold text-sm">N</span>
          </div>
          <span className="font-bold text-white text-sm">
            Nutanix <span className="text-nutanix-400">NKP</span>
          </span>
        </div>

        {/* Content */}
        <div className="relative space-y-8">
          <div>
            <div className="w-12 h-12 rounded-2xl bg-nutanix-800 flex items-center justify-center mb-6">
              <Server size={24} className="text-nutanix-300" />
            </div>
            <h2 className="text-3xl font-bold text-white leading-tight mb-3">
              Demo Portal
            </h2>
            <p className="text-nutanix-300 leading-relaxed">
              Access your assigned cluster and explore NKP capabilities hands-on.
            </p>
          </div>

          <ul className="space-y-3">
            {panelFeatures.map((f) => (
              <li key={f} className="flex items-center gap-3 text-nutanix-200 text-sm">
                <CheckCircle size={15} className="text-nutanix-400 shrink-0" />
                {f}
              </li>
            ))}
          </ul>
        </div>

        {/* Footer note */}
        <p className="relative text-xs text-nutanix-600">
          For internal training use only.
        </p>
      </div>

      {/* ── Right form panel ──────────────────────────── */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-gray-50">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-7 h-7 rounded-lg bg-nutanix-800 flex items-center justify-center">
              <span className="text-white font-bold text-xs">N</span>
            </div>
            <span className="font-bold text-gray-900 text-sm">
              Nutanix <span className="text-nutanix-700">NKP</span> — Demo Portal
            </span>
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Sign in</h1>
            <p className="text-gray-500 text-sm mt-1">Enter your credentials to access the Demo Portal.</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Username
              </label>
              <input
                type="text"
                required
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                placeholder="Enter your username"
                className="input-field"
                autoComplete="username"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  required
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="••••••••"
                  className="input-field pr-10"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  tabIndex={-1}
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-2.5 disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100"
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              ) : (
                <><LogIn size={15} /> Sign in to Demo Portal</>
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            Looking for the Workshop?{' '}
            <Link to="/workshop" className="font-medium text-nutanix-700 hover:text-nutanix-900 transition-colors">
              Workshop Portal →
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
