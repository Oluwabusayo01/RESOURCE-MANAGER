import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import ProtectedRoute from './ProtectedRoute'

export default function DashboardLayout() {
  return (
    <ProtectedRoute>
      <div className="flex min-h-screen bg-light-gray">
        <Sidebar />
        <main className="flex-1 p-4 pt-16 lg:pt-8 lg:p-8 overflow-y-auto">
          <div className="container mx-auto max-w-6xl">
            <Outlet />
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}
