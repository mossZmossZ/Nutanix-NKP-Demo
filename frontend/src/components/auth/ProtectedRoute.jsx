import { Navigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'

export default function ProtectedRoute({ children, portal }) {
  const { user, loading, hasPortalAccess } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-nutanix-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!user) return <Navigate to={`/${portal}`} replace />
  if (!hasPortalAccess(portal)) return <Navigate to="/" replace />

  return children
}
