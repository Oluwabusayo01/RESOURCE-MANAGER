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

// Admin Pages
import AdminDashboard from '@/pages/admin/AdminDashboard'
import ManageResourcesPage from '@/pages/admin/ManageResourcesPage'
import ManageUsersPage from '@/pages/admin/ManageUsersPage'
import AllBookingsPage from '@/pages/admin/AllBookingsPage'

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
        {/* Public Routes */}
        <Route path="/" element={<HomePage />} />
        <Route path="/schedule" element={<SchedulePage />} />
        <Route path="/library" element={<ELibraryPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/status" element={<StatusPage />} />

        {/* Class Rep Routes */}
        <Route path="/classrep/dashboard" element={<ClassRepDashboard />} />
        <Route path="/classrep/book" element={<BookingPage />} />
        <Route path="/classrep/bookings/:id" element={<BookingDetailPage />} />
        <Route path="/classrep/notifications" element={<NotificationsPage />} />

        {/* Staff Routes */}
        <Route path="/staff/dashboard" element={<StaffDashboard />} />
        <Route path="/staff/book" element={<BookingPage />} />
        <Route path="/staff/bookings/:id" element={<BookingDetailPage />} />
        <Route path="/staff/upload" element={<UploadMaterialPage />} />
        <Route path="/staff/notifications" element={<NotificationsPage />} />

        {/* Admin Routes */}
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/resources" element={<ManageResourcesPage />} />
        <Route path="/admin/users" element={<ManageUsersPage />} />
        <Route path="/admin/bookings" element={<AllBookingsPage />} />

        {/* 404 Route */}
        <Route path="*" element={<div className="flex items-center justify-center h-screen">404 — Page Not Found</div>} />
      </Routes>
      <Toaster position="top-center" richColors />
      {import.meta.env.VITE_USE_MOCK === 'true' && (
        <div className="fixed bottom-0 left-0 right-0 bg-black text-white text-[10px] py-1 text-center z-9999 opacity-80 pointer-events-none">
          🟡 Demo Mode — Using mock data. Backend not connected.
        </div>
      )}
    </Router>
  )
}

export default App
