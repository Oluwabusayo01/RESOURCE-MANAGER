import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/store/useAuthStore'
import type { UserRole } from '@/types'

interface ProtectedRouteProps {
  children: React.ReactNode
  allowedRoles?: UserRole[]
}

export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, token } = useAuthStore()
  const location = useLocation()

  if (!token || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (user.status === 'pending' || user.status === 'rejected') {
    if (location.pathname !== '/status') {
      return <Navigate to="/status" replace />
    }
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect to their respective dashboard if they try to access a role-protected route
    const dashboardMap: Record<UserRole, string> = {
      admin: '/admin/dashboard',
      staff: '/staff/dashboard',
      classrep: '/classrep/dashboard',
    }
    return <Navigate to={dashboardMap[user.role]} replace />
  }

  return <>{children}</>
}
