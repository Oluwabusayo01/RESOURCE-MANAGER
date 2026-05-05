import { useEffect } from 'react'
import { Bell } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { notificationService } from '@/lib/apiService'
import { useNotificationStore } from '@/store/useNotificationStore'
import { useAuthStore } from '@/store/useAuthStore'

export default function NotificationBell() {
  const navigate = useNavigate()
  const { unreadCount, setUnreadCount } = useNotificationStore()
  const { user } = useAuthStore()

  useEffect(() => {
    const fetchUnread = async () => {
      if (!user) return
      try {
        const data = await notificationService.getAll({ unread: true })
        setUnreadCount(data.length)
      } catch (err) {
        console.error('Failed to fetch notifications', err)
      }
    }

    fetchUnread()
    // Poll every 60 seconds for demo purposes
    const interval = setInterval(fetchUnread, 60000)
    return () => clearInterval(interval)
  }, [user, setUnreadCount])

  const handleClick = () => {
    if (!user) return
    const pathMap: Record<string, string> = {
      classrep: '/classrep/notifications',
      staff: '/staff/notifications',
      admin: '/admin/dashboard', // Admin might see notifications on dashboard
    }
    navigate(pathMap[user.role] || '/')
  }

  return (
    <button 
      onClick={handleClick}
      className="relative p-2 rounded-full hover:bg-light-gray transition-colors"
      aria-label="Notifications"
    >
      <Bell className="w-6 h-6 text-accent" />
      {unreadCount > 0 && (
        <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-gold text-[10px] font-bold text-accent border border-white">
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
    </button>
  )
}
