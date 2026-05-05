import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { formatDistanceToNow } from 'date-fns'
import { useAuthStore } from '@/store/useAuthStore'
import { bookingService, notificationService } from '@/lib/apiService'
import type { Booking, Notification } from '@/types'

import NotificationBell from '@/components/shared/NotificationBell'
import StatusBadge from '@/components/shared/StatusBadge'
import BookingModal from '@/components/shared/BookingModal'
import ClassUpdateModal from '@/components/shared/ClassUpdateModal'
import ConfirmDialog from '@/components/shared/ConfirmDialog'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

import {
  CalendarCheck,
  Clock,
  Megaphone,
  Users,
  Plus,
  Send,
  Eye,
  XCircle,
  Bell,
  ArrowRight,
} from 'lucide-react'
import { toast } from 'sonner'

export default function ClassRepDashboard() {
  const { user } = useAuthStore()
  const navigate = useNavigate()

  const [bookings, setBookings] = useState<Booking[]>([])
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)

  const [bookingModalOpen, setBookingModalOpen] = useState(false)
  const [classUpdateOpen, setClassUpdateOpen] = useState(false)
  const [cancelDialog, setCancelDialog] = useState<{ open: boolean; id: string }>({ open: false, id: '' })

  const fetchData = async () => {
    setLoading(true)
    try {
      const [bookingsData, notifData] = await Promise.all([
        bookingService.getAll({ userId: user?.id }),
        notificationService.getAll({ userId: user?.id, limit: 3 }),
      ])
      setBookings(bookingsData)
      setNotifications(notifData)
    } catch (err) {
      console.error('Failed to load dashboard data', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [user?.id])

  // Computed stats
  const stats = useMemo(() => {
    const today = new Date().toISOString().split('T')[0]
    return {
      total: bookings.length,
      upcoming: bookings.filter(b => b.status === 'confirmed' && b.date >= today).length,
      classUpdates: notifications.filter(n => n.type === 'class_update').length,
      attendance: bookings.reduce((sum, b) => sum + (b.attendance || 0), 0),
    }
  }, [bookings, notifications])

  const handleCancel = async () => {
    try {
      await bookingService.cancel(cancelDialog.id)
      toast.success('Booking cancelled.')
      setCancelDialog({ open: false, id: '' })
      fetchData()
    } catch (err: any) {
      toast.error(err.message || 'Failed to cancel booking.')
    }
  }

  const statCards = [
    { label: 'Total My Bookings', value: stats.total, icon: CalendarCheck, color: 'text-blue-500', bg: 'bg-blue-50' },
    { label: 'Upcoming Sessions', value: stats.upcoming, icon: Clock, color: 'text-gold', bg: 'bg-gold/10' },
    { label: 'Class Updates Sent', value: stats.classUpdates, icon: Megaphone, color: 'text-purple-500', bg: 'bg-purple-50' },
    { label: 'Attendance Logged', value: stats.attendance, icon: Users, color: 'text-green-500', bg: 'bg-green-50' },
  ]

  const recentBookings = [...bookings].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5)
  const today = new Date().toISOString().split('T')[0]

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-8"
    >
      {/* 1. Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-accent">
            Welcome back, {user?.name?.split(' ')[0]} 👋
          </h1>
          <p className="text-dark-gray text-sm mt-1">Here's what's happening with your bookings today.</p>
        </div>
        <NotificationBell />
      </div>

      {/* 2. Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {loading
          ? [1, 2, 3, 4].map(i => (
            <Card key={i} className="border border-mid-gray/20">
              <CardContent className="p-5 space-y-3">
                <Skeleton className="h-10 w-10 rounded-lg" />
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-4 w-24" />
              </CardContent>
            </Card>
          ))
          : statCards.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <Card className="border border-mid-gray/20 hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  <div className={`w-10 h-10 ${s.bg} rounded-lg flex items-center justify-center mb-3`}>
                    <s.icon className={`w-5 h-5 ${s.color}`} />
                  </div>
                  <p className="text-3xl font-black text-accent">{s.value}</p>
                  <p className="text-xs font-bold text-dark-gray uppercase tracking-wider mt-1">{s.label}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
      </div>

      {/* 3. Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <button
          onClick={() => setBookingModalOpen(true)}
          className="flex items-center gap-4 p-5 bg-accent text-white rounded-xl hover:bg-accent/90 transition-all group"
        >
          <div className="p-3 bg-white/10 rounded-lg group-hover:bg-white/20 transition-colors">
            <Plus className="w-6 h-6" />
          </div>
          <div className="text-left">
            <p className="font-bold text-lg">Book a Resource</p>
            <p className="text-sm text-mid-gray">Reserve a lab, hall, or seminar room</p>
          </div>
        </button>

        <button
          onClick={() => setClassUpdateOpen(true)}
          className="flex items-center gap-4 p-5 bg-white border border-mid-gray/20 rounded-xl hover:border-gold hover:shadow-md transition-all group"
        >
          <div className="p-3 bg-gold/10 rounded-lg group-hover:bg-gold/20 transition-colors">
            <Send className="w-6 h-6 text-gold" />
          </div>
          <div className="text-left">
            <p className="font-bold text-lg text-accent">Push Class Update</p>
            <p className="text-sm text-dark-gray">Notify your class about schedule changes</p>
          </div>
        </button>
      </div>

      {/* 4. My Bookings Table */}
      <div className="bg-white rounded-xl border border-mid-gray/20 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="text-lg font-black text-accent">My Bookings</h2>
          <button className="text-gold text-sm font-bold flex items-center gap-1 hover:underline">
            View All <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {loading ? (
          <div className="p-5 space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
          </div>
        ) : recentBookings.length === 0 ? (
          <div className="p-12 text-center">
            <CalendarCheck className="w-12 h-12 text-mid-gray mx-auto mb-3" />
            <p className="text-dark-gray font-medium">You have no bookings yet.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-bold">Resource</TableHead>
                <TableHead className="font-bold">Course</TableHead>
                <TableHead className="font-bold">Date</TableHead>
                <TableHead className="font-bold">Time</TableHead>
                <TableHead className="font-bold">Status</TableHead>
                <TableHead className="font-bold text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentBookings.map((b) => (
                <TableRow key={b.id} className="hover:bg-light-gray/50">
                  <TableCell className="font-bold">{b.resource.name}</TableCell>
                  <TableCell className="text-dark-gray">{b.course}</TableCell>
                  <TableCell>{b.date}</TableCell>
                  <TableCell className="text-sm">{b.startTime} – {b.endTime}</TableCell>
                  <TableCell><StatusBadge status={b.status} /></TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate(`/classrep/bookings/${b.id}`)}
                      className="text-accent"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    {b.status === 'confirmed' && b.date >= today && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setCancelDialog({ open: true, id: b.id })}
                        className="text-red-500 hover:text-red-600"
                      >
                        <XCircle className="w-4 h-4" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* 5. Recent Notifications */}
      <div className="bg-white rounded-xl border border-mid-gray/20 shadow-sm">
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="text-lg font-black text-accent">Recent Notifications</h2>
          <button
            onClick={() => navigate('/classrep/notifications')}
            className="text-gold text-sm font-bold flex items-center gap-1 hover:underline"
          >
            View All <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {loading ? (
          <div className="p-5 space-y-4">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-dark-gray text-sm">No recent notifications.</p>
          </div>
        ) : (
          <div className="divide-y">
            {notifications.map((n) => (
              <div key={n.id} className="flex items-start gap-3 p-4 hover:bg-light-gray/50 transition-colors">
                <div className={`p-2 rounded-lg mt-0.5 ${n.read ? 'bg-light-gray' : 'bg-gold/10'}`}>
                  <Bell className={`w-4 h-4 ${n.read ? 'text-mid-gray' : 'text-gold'}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm ${n.read ? 'text-dark-gray' : 'text-accent font-bold'}`}>
                    {n.message}
                  </p>
                  <p className="text-xs text-mid-gray mt-1">
                    {formatDistanceToNow(new Date(n.timestamp), { addSuffix: true })}
                  </p>
                </div>
                {!n.read && <div className="w-2 h-2 rounded-full bg-gold mt-2 shrink-0" />}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      <BookingModal
        isOpen={bookingModalOpen}
        onClose={() => setBookingModalOpen(false)}
        onSuccess={fetchData}
      />
      <ClassUpdateModal
        isOpen={classUpdateOpen}
        onClose={() => setClassUpdateOpen(false)}
      />
      <ConfirmDialog
        isOpen={cancelDialog.open}
        title="Cancel Booking"
        description="Are you sure you want to cancel this booking? This action cannot be undone."
        confirmLabel="Cancel Booking"
        onConfirm={handleCancel}
        onCancel={() => setCancelDialog({ open: false, id: '' })}
      />
    </motion.div>
  )
}
