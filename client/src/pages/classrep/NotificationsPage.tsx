import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { formatDistanceToNow } from 'date-fns'
import { notificationService } from '@/lib/apiService'
import { useNotificationStore } from '@/store/useNotificationStore'
import type { NotificationType } from '@/types'

import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

import {
  CalendarCheck,
  UserCheck,
  UserX,
  Megaphone,
  Clock,
  Info,
  CheckCheck,
  Bell,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { toast } from 'sonner'
import { useState } from 'react'

const PER_PAGE = 10


const iconMap: Record<NotificationType, { icon: typeof CalendarCheck; color: string }> = {
  booking_confirmed: { icon: CalendarCheck, color: 'text-green-600' },
  registration_approved: { icon: UserCheck, color: 'text-green-600' },
  registration_rejected: { icon: UserX, color: 'text-red-500' },
  class_update: { icon: Megaphone, color: 'text-gold' },
  auto_reminder: { icon: Clock, color: 'text-blue-500' },
  system: { icon: Info, color: 'text-gray-400' },
}

export default function NotificationsPage() {
  const { notifications, setNotifications, setUnreadCount } = useNotificationStore()
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)

  const fetchNotifications = async () => {
    setLoading(true)
    try {
      const data = await notificationService.getAll()
      // Sort newest first
      const sorted = [...data].sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      )
      setNotifications(sorted)
      setUnreadCount(sorted.filter(n => !n.read).length)
    } catch (err) {
      console.error('Failed to load notifications', err)
    } finally {
      setLoading(false)
    }
  }

  // Pagination logic
  const safeNotifications = notifications || []
  const totalPages = Math.ceil(safeNotifications.length / PER_PAGE)
  const paginatedNotifications = safeNotifications.slice((page - 1) * PER_PAGE, page * PER_PAGE)
  const validNotifications = paginatedNotifications.filter(n => n && n.id)

  useEffect(() => {
    fetchNotifications()

  }, [])

  const handleMarkRead = async (id: string) => {
    try {
      await notificationService.markRead(id)
      const updated = notifications.map(n =>
        n.id === id ? { ...n, read: true } : n
      )
      setNotifications(updated)
      setUnreadCount(updated.filter(n => !n.read).length)
    } catch (err) {
      console.error('Failed to mark notification read', err)
    }
  }

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllRead()
      const updated = notifications.map(n => ({ ...n, read: true }))
      setNotifications(updated)
      setUnreadCount(0)
      toast.success('All notifications marked as read.')
    } catch (err: any) {
      toast.error(err.message || 'Failed to mark all as read.')
    }
  }

  const unreadCount = safeNotifications.filter(n => n && !n.read).length

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-3xl font-black text-accent">Notifications</h1>
          <div className="h-5 flex items-center mt-1">
            {loading ? (
              <Skeleton className="h-4 w-40" />
            ) : (
              <p className="text-dark-gray text-[10px] sm:text-sm">
                {unreadCount > 0
                  ? `You have ${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}.`
                  : "You're all caught up!"}
              </p>
            )}
          </div>
        </div>
        {!loading && unreadCount > 0 && (
          <Button
            variant="outline"
            onClick={handleMarkAllRead}
            className="gap-2 font-bold text-dark-gray w-full sm:w-auto h-11 sm:h-10"
          >
            <CheckCheck className="w-4 h-4" />
            Mark All as Read
          </Button>
        )}
      </div>

      {/* Notification List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="flex items-start gap-4 p-4 rounded-xl bg-white border border-light-gray shadow-sm">
              {/* Icon Skeleton */}
              <Skeleton className="w-10 h-10 rounded-lg shrink-0" />
              
              {/* Content Skeleton */}
              <div className="flex-1 space-y-2 py-1">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/4" />
              </div>
            </div>
          ))}
        </div>
      ) : safeNotifications.length === 0 ? (
        <div className="text-center py-20">
          <Bell className="w-16 h-16 text-mid-gray mx-auto mb-4" />
          <p className="text-lg font-bold text-dark-gray">You have no notifications yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="space-y-2">
            {validNotifications.map((n, i) => {
              const config = iconMap[n.type] || iconMap.system
              const Icon = config.icon

              return (
                <motion.div
                  key={n.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  onClick={() => !n.read && handleMarkRead(n.id)}
                  className={`flex items-start gap-4 p-4 rounded-xl transition-all cursor-pointer ${n.read
                      ? 'bg-white hover:bg-light-gray/50 animate-hover'
                      : 'bg-[#FAFAFA] border-l-4 border-gold hover:bg-gold/5 animate-hover'
                    }`}
                >
                  {/* Icon */}
                  <div className={`p-2.5 rounded-lg shrink-0 ${n.read ? 'bg-light-gray' : 'bg-gold/10'}`}>
                    <Icon className={`w-5 h-5 ${config.color}`} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${n.read ? 'text-dark-gray' : 'text-accent font-bold'}`}>
                      {n.message}
                    </p>
                    <p className="text-xs text-mid-gray mt-1">
                      {formatDistanceToNow(new Date(n.timestamp), { addSuffix: true })}
                    </p>
                  </div>

                  {/* Unread Dot */}
                  {!n.read && (
                    <div className="w-2.5 h-2.5 rounded-full bg-gold shrink-0 mt-2" />
                  )}
                </motion.div>
              )
            })}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between p-4 border rounded-xl bg-white shadow-sm">
              <p className="text-xs font-bold text-dark-gray uppercase tracking-wider">
                Page {page} of {totalPages}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="gap-1"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Prev
                </Button>
                <span className="text-sm font-bold text-accent px-2">
                  {page} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="gap-1"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </motion.div>
  )
}
