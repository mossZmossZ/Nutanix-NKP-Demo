import { Navigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'

export default function AdminRoute({ children }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-4 border-nutanix-200 border-t-nutanix-700 rounded-full animate-spin" />
      </div>
    )
  }

  if (!user || user.role !== 'admin') return <Navigate to="/admin" replace />

  return children
}
