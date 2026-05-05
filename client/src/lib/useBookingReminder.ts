import { useCallback } from 'react'
import { useNotificationStore } from '@/store/useNotificationStore'

/**
 * Hook that schedules a browser notification 1 hour before a booking starts.
 * Also adds an auto_reminder notification to the store.
 */
export function useBookingReminder() {

  const scheduleReminder = useCallback(
    (booking: { date: string; startTime: string; resource: { name: string }; course: string; id: string }) => {
      // Parse the booking start datetime
      const [year, month, day] = booking.date.split('-').map(Number)
      const [hours, minutes] = booking.startTime.split(':').map(Number)
      const bookingStart = new Date(year, month - 1, day, hours, minutes)

      // Calculate ms until 1 hour before booking
      const reminderTime = new Date(bookingStart.getTime() - 60 * 60 * 1000)
      const msUntilReminder = reminderTime.getTime() - Date.now()

      if (msUntilReminder <= 0) return // Already past the reminder window

      const timeoutId = setTimeout(() => {
        // 1. Add notification to store
        const newNotification = {
          id: `auto_${booking.id}_${Date.now()}`,
          type: 'auto_reminder' as const,
          message: `Reminder: ${booking.resource.name} (${booking.course}) starts in 1 hour.`,
          timestamp: new Date().toISOString(),
          read: false,
          userId: '',
        }

        const current = useNotificationStore.getState().notifications
        const updated = [newNotification, ...current]
        useNotificationStore.getState().setNotifications(updated)
        useNotificationStore.getState().setUnreadCount(updated.filter(n => !n.read).length)

        // 2. Browser notification
        if ('Notification' in window) {
          if (Notification.permission === 'granted') {
            new Notification('Booking Reminder', {
              body: `${booking.resource.name} (${booking.course}) starts in 1 hour.`,
              icon: '/favicon.ico',
            })
          } else if (Notification.permission !== 'denied') {
            Notification.requestPermission().then(permission => {
              if (permission === 'granted') {
                new Notification('Booking Reminder', {
                  body: `${booking.resource.name} (${booking.course}) starts in 1 hour.`,
                  icon: '/favicon.ico',
                })
              }
            })
          }
        }
      }, msUntilReminder)

      // Return cleanup function
      return () => clearTimeout(timeoutId)
    },
    []
  )

  return { scheduleReminder }
}
