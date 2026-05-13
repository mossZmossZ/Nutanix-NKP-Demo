import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from '@/context/AuthContext'
import Layout from '@/components/layout/Layout'
import Home from '@/pages/Home'
import InstallationGuide from '@/pages/InstallationGuide'
import DemoLogin from '@/pages/demo/DemoLogin'
import DemoDashboard from '@/pages/demo/DemoDashboard'
import WorkshopLogin from '@/pages/workshop/WorkshopLogin'
import WorkshopDashboard from '@/pages/workshop/WorkshopDashboard'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import NotFound from '@/pages/NotFound'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="installation" element={<InstallationGuide />} />
            <Route path="demo" element={<DemoLogin />} />
            <Route path="workshop" element={<WorkshopLogin />} />
            <Route
              path="demo/dashboard"
              element={
                <ProtectedRoute portal="demo">
                  <DemoDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="workshop/dashboard"
              element={
                <ProtectedRoute portal="workshop">
                  <WorkshopDashboard />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
