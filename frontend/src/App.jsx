import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from '@/context/AuthContext'
import Layout from '@/components/layout/Layout'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import AdminRoute from '@/components/auth/AdminRoute'

import Home from '@/pages/Home'
import InstallationGuide from '@/pages/InstallationGuide'
import PdfFullView       from '@/pages/PdfFullView'
import DemoLogin from '@/pages/demo/DemoLogin'
import DemoDashboard from '@/pages/demo/DemoDashboard'
import WorkshopLogin from '@/pages/workshop/WorkshopLogin'
import WorkshopDashboard from '@/pages/workshop/WorkshopDashboard'
import LabViewer from '@/pages/workshop/LabViewer'
import AdminLogin from '@/pages/admin/AdminLogin'
import AdminDashboard from '@/pages/admin/AdminDashboard'
import NotFound from '@/pages/NotFound'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* ── Main site (with Navbar/Footer) ── */}
          <Route element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="installation" element={<InstallationGuide />} />
            <Route path="demo" element={<DemoLogin />} />
            <Route path="workshop" element={<WorkshopLogin />} />
            <Route
              path="demo/dashboard"
              element={<ProtectedRoute portal="demo"><DemoDashboard /></ProtectedRoute>}
            />
            <Route
              path="workshop/dashboard"
              element={<ProtectedRoute portal="workshop"><WorkshopDashboard /></ProtectedRoute>}
            />
            <Route path="*" element={<NotFound />} />
          </Route>

          {/* ── Full-page PDF viewer (no Navbar/Footer) ── */}
          <Route path="/installation/pdf" element={<PdfFullView />} />

          {/* ── Lab Viewer (full-screen, no Navbar/Footer) ── */}
          <Route
            path="/workshop/:workshopId/lab"
            element={<ProtectedRoute portal="workshop"><LabViewer /></ProtectedRoute>}
          />

          {/* ── Admin (no Navbar/Footer) ── */}
          <Route path="/admin" element={<AdminLogin />} />
          <Route
            path="/admin/dashboard/*"
            element={<AdminRoute><AdminDashboard /></AdminRoute>}
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
