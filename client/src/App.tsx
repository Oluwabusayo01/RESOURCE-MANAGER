import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Toaster } from '@/components/ui/sonner'
import { useEffect } from 'react'
import { useAuthStore } from '@/store/useAuthStore'

// Public Pages
import HomePage from '@/pages/public/HomePage'
import SchedulePage from '@/pages/public/SchedulePage'
import ELibraryPage from '@/pages/public/ELibraryPage'

// Auth Pages
import LoginPage from '@/pages/auth/LoginPage'
import RegisterPage from '@/pages/auth/RegisterPage'
import StatusPage from '@/pages/auth/StatusPage'

// Class Rep Pages
import ClassRepDashboard from '@/pages/classrep/ClassRepDashboard'
import BookingPage from '@/pages/classrep/BookingPage'
import BookingDetailPage from '@/pages/classrep/BookingDetailPage'
import NotificationsPage from '@/pages/classrep/NotificationsPage'

// Staff Pages
import StaffDashboard from '@/pages/staff/StaffDashboard'
import UploadMaterialPage from '@/pages/staff/UploadMaterialPage'

// Shared Pages
import MyBookingsPage from '@/pages/shared/MyBookingsPage'

// Admin Pages
import AdminDashboard from '@/pages/admin/AdminDashboard'
import ManageResourcesPage from '@/pages/admin/ManageResourcesPage'
import ManageUsersPage from '@/pages/admin/ManageUsersPage'
import AllBookingsPage from '@/pages/admin/AllBookingsPage'

import PublicLayout from '@/components/shared/PublicLayout'
import DashboardLayout from '@/components/shared/DashboardLayout'
import ProtectedRoute from '@/components/shared/ProtectedRoute'

function App() {
  const { setUser, setToken } = useAuthStore()

  useEffect(() => {
    const user = localStorage.getItem('rm_user')
    const token = localStorage.getItem('rm_token')
    if (user && token) {
      try {
        setUser(JSON.parse(user))
        setToken(token)
      } catch (e) {
        console.error('Failed to parse user from localStorage', e)
      }
    }
  }, [setUser, setToken])

  return (
    <Router>
      <Routes>
        {/* Public Routes (with Navbar + Footer) */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/schedule" element={<SchedulePage />} />
          <Route path="/library" element={<ELibraryPage />} />
        </Route>

        {/* Auth Routes (standalone — no Navbar/Sidebar) */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/status" element={<StatusPage />} />

        {/* Dashboard Routes */}
        <Route element={<DashboardLayout />}>
          {/* Class Rep Routes */}
          <Route path="/classrep/dashboard" element={<ProtectedRoute allowedRoles={['classrep']}><ClassRepDashboard /></ProtectedRoute>} />
          <Route path="/classrep/book" element={<ProtectedRoute allowedRoles={['classrep']}><BookingPage /></ProtectedRoute>} />
          <Route path="/classrep/bookings" element={<ProtectedRoute allowedRoles={['classrep']}><MyBookingsPage /></ProtectedRoute>} />
          <Route path="/classrep/bookings/:id" element={<ProtectedRoute allowedRoles={['classrep']}><BookingDetailPage /></ProtectedRoute>} />
          <Route path="/classrep/notifications" element={<ProtectedRoute allowedRoles={['classrep']}><NotificationsPage /></ProtectedRoute>} />

          {/* Staff Routes */}
          <Route path="/staff/dashboard" element={<ProtectedRoute allowedRoles={['staff']}><StaffDashboard /></ProtectedRoute>} />
          <Route path="/staff/book" element={<ProtectedRoute allowedRoles={['staff']}><BookingPage /></ProtectedRoute>} />
          <Route path="/staff/bookings" element={<ProtectedRoute allowedRoles={['staff']}><MyBookingsPage /></ProtectedRoute>} />
          <Route path="/staff/bookings/:id" element={<ProtectedRoute allowedRoles={['staff']}><BookingDetailPage /></ProtectedRoute>} />
          <Route path="/staff/upload" element={<ProtectedRoute allowedRoles={['staff']}><UploadMaterialPage /></ProtectedRoute>} />
          <Route path="/staff/notifications" element={<ProtectedRoute allowedRoles={['staff']}><NotificationsPage /></ProtectedRoute>} />

          {/* Admin Routes */}
          <Route path="/admin/dashboard" element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/resources" element={<ProtectedRoute allowedRoles={['admin']}><ManageResourcesPage /></ProtectedRoute>} />
          <Route path="/admin/users" element={<ProtectedRoute allowedRoles={['admin']}><ManageUsersPage /></ProtectedRoute>} />
          <Route path="/admin/bookings" element={<ProtectedRoute allowedRoles={['admin']}><AllBookingsPage /></ProtectedRoute>} />
        </Route>

        {/* 404 Route */}
        <Route path="*" element={
          <div className="flex flex-col items-center justify-center h-screen bg-light-gray gap-4">
            <p className="text-8xl font-black text-accent">404</p>
            <p className="text-lg text-dark-gray font-medium">Page Not Found</p>
            <p className="text-sm text-mid-gray">The page you are looking for does not exist.</p>
            <a href="/" className="mt-4 inline-flex items-center gap-2 px-6 py-3 bg-accent text-white font-bold rounded-lg hover:bg-accent/90 transition-colors">
              Go Home
            </a>
          </div>
        } />
      </Routes>
      <Toaster position="top-center" richColors />
      {import.meta.env.VITE_USE_MOCK === 'true' && (
        <div className="fixed bottom-0 left-0 right-0 bg-black text-white text-[10px] py-1 text-center z-50 opacity-80 pointer-events-none">
          🟡 Demo Mode — Using mock data. Backend not connected.
        </div>
      )}
    </Router>
  )
}

export default App
