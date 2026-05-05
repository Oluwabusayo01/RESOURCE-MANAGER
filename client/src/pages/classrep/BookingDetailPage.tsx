import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useParams, useNavigate } from 'react-router-dom'
import { bookingService } from '@/lib/apiService'
import { useAuthStore } from '@/store/useAuthStore'
import type { Booking } from '@/types'

import StatusBadge from '@/components/shared/StatusBadge'
import ConfirmDialog from '@/components/shared/ConfirmDialog'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'

import {
  ArrowLeft,
  Calendar,
  Clock,
  BookOpen,
  MapPin,
  Users,
  CheckCircle2,
  Circle,
  XCircle,
  Ban,
  Loader2,
} from 'lucide-react'
import { toast } from 'sonner'

export default function BookingDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuthStore()
  const navigate = useNavigate()

  const [booking, setBooking] = useState<Booking | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [cancelOpen, setCancelOpen] = useState(false)
  const [attendanceEdit, setAttendanceEdit] = useState(false)
  const [attendanceValue, setAttendanceValue] = useState('')
  const [savingAttendance, setSavingAttendance] = useState(false)

  const fetchBooking = async () => {
    if (!id) return
    setLoading(true)
    setError(null)
    try {
      const data = await bookingService.getById(id)
      setBooking(data)
      if (data.attendance !== null) {
        setAttendanceValue(String(data.attendance))
      }
    } catch (err: any) {
      setError(err.message || 'Booking not found.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBooking()
  }, [id])

  const handleCancel = async () => {
    if (!id) return
    try {
      await bookingService.cancel(id)
      toast.success('Booking cancelled.')
      const dashboardPath = user?.role === 'staff' ? '/staff/dashboard' : '/classrep/dashboard'
      navigate(dashboardPath)
    } catch (err: any) {
      toast.error(err.message || 'Failed to cancel booking.')
    }
  }

  const handleSaveAttendance = async () => {
    if (!id || !attendanceValue) return
    const num = parseInt(attendanceValue, 10)
    if (isNaN(num) || num < 0) {
      toast.error('Please enter a valid number.')
      return
    }

    setSavingAttendance(true)
    try {
      await bookingService.logAttendance(id, num)
      toast.success('Attendance logged successfully.')
      setAttendanceEdit(false)
      fetchBooking()
    } catch (err: any) {
      toast.error(err.message || 'Failed to log attendance.')
    } finally {
      setSavingAttendance(false)
    }
  }

  const today = new Date().toISOString().split('T')[0]
  const dashboardPath = user?.role === 'staff' ? '/staff/dashboard' : '/classrep/dashboard'

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full rounded-xl" />
        <Skeleton className="h-32 w-full rounded-xl" />
      </div>
    )
  }

  if (error || !booking) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <XCircle className="w-16 h-16 text-red-400 mb-4" />
        <h2 className="text-xl font-black text-accent mb-2">Booking Not Found</h2>
        <p className="text-dark-gray text-sm mb-6">{error || "The booking you're looking for doesn't exist."}</p>
        <Button onClick={fetchBooking} variant="outline" className="mr-2">Retry</Button>
        <Button onClick={() => navigate(dashboardPath)} className="bg-accent text-white">Back to Dashboard</Button>
      </div>
    )
  }

  const isFuture = booking.date >= today
  const canCancel = booking.status === 'confirmed' && isFuture
  const canLogAttendance = booking.status === 'confirmed' && booking.date <= today

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      {/* Back Button */}
      <button
        onClick={() => navigate(dashboardPath)}
        className="flex items-center gap-2 text-dark-gray hover:text-accent transition-colors text-sm font-medium"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Dashboard
      </button>

      {/* 1. Booking Info Card */}
      <Card className="border border-mid-gray/20 shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-2xl font-black text-accent">{booking.resource.name}</h1>
              <p className="text-dark-gray font-medium mt-1">{booking.course}</p>
            </div>
            <StatusBadge status={booking.status} />
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-light-gray rounded-lg p-4">
              <div className="flex items-center gap-2 mb-1">
                <MapPin className="w-4 h-4 text-gold" />
                <span className="text-[10px] font-bold text-dark-gray uppercase">Resource Type</span>
              </div>
              <p className="font-bold text-accent capitalize">{booking.resource.type}</p>
            </div>
            <div className="bg-light-gray rounded-lg p-4">
              <div className="flex items-center gap-2 mb-1">
                <Calendar className="w-4 h-4 text-gold" />
                <span className="text-[10px] font-bold text-dark-gray uppercase">Date</span>
              </div>
              <p className="font-bold text-accent">{booking.date}</p>
            </div>
            <div className="bg-light-gray rounded-lg p-4">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="w-4 h-4 text-gold" />
                <span className="text-[10px] font-bold text-dark-gray uppercase">Time</span>
              </div>
              <p className="font-bold text-accent">{booking.startTime} – {booking.endTime}</p>
            </div>
            <div className="bg-light-gray rounded-lg p-4">
              <div className="flex items-center gap-2 mb-1">
                <BookOpen className="w-4 h-4 text-gold" />
                <span className="text-[10px] font-bold text-dark-gray uppercase">Department</span>
              </div>
              <p className="font-bold text-accent text-sm">{booking.department}</p>
            </div>
          </div>

          {booking.notes && (
            <div className="mt-4 p-3 bg-light-gray rounded-lg">
              <p className="text-xs font-bold text-dark-gray uppercase mb-1">Notes</p>
              <p className="text-sm text-accent">{booking.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 2. Status Timeline */}
      <Card className="border border-mid-gray/20 shadow-sm">
        <CardContent className="p-6">
          <h2 className="text-sm font-bold text-dark-gray uppercase tracking-wider mb-6">Status Timeline</h2>

          <div className="flex items-center gap-0">
            {/* Step 1: Submitted */}
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 rounded-full bg-gold flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-white" />
              </div>
              <p className="text-xs font-bold text-gold mt-2">Submitted</p>
            </div>

            {/* Connector */}
            <div className={`flex-1 h-0.5 mx-2 ${booking.status === 'confirmed' ? 'bg-gold' : booking.status === 'cancelled' ? 'bg-red-400' : 'bg-mid-gray'}`} />

            {/* Step 2: Confirmed or Cancelled */}
            <div className="flex flex-col items-center">
              {booking.status === 'confirmed' ? (
                <>
                  <div className="w-10 h-10 rounded-full bg-gold flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5 text-white" />
                  </div>
                  <p className="text-xs font-bold text-gold mt-2">Confirmed</p>
                </>
              ) : booking.status === 'cancelled' ? (
                <>
                  <div className="w-10 h-10 rounded-full bg-red-500 flex items-center justify-center">
                    <Ban className="w-5 h-5 text-white" />
                  </div>
                  <p className="text-xs font-bold text-red-500 mt-2">Cancelled</p>
                </>
              ) : (
                <>
                  <div className="w-10 h-10 rounded-full bg-mid-gray/30 flex items-center justify-center">
                    <Circle className="w-5 h-5 text-mid-gray" />
                  </div>
                  <p className="text-xs font-bold text-mid-gray mt-2">Pending</p>
                </>
              )}
            </div>

            {/* Connector to Attendance */}
            <div className={`flex-1 h-0.5 mx-2 ${booking.attendance !== null ? 'bg-gold' : 'bg-mid-gray/30'}`} />

            {/* Step 3: Attendance */}
            <div className="flex flex-col items-center">
              {booking.attendance !== null ? (
                <>
                  <div className="w-10 h-10 rounded-full bg-gold flex items-center justify-center">
                    <Users className="w-5 h-5 text-white" />
                  </div>
                  <p className="text-xs font-bold text-gold mt-2">Attended</p>
                </>
              ) : (
                <>
                  <div className="w-10 h-10 rounded-full bg-mid-gray/30 flex items-center justify-center">
                    <Circle className="w-5 h-5 text-mid-gray" />
                  </div>
                  <p className="text-xs font-bold text-mid-gray mt-2">Attendance</p>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 3. Log Attendance */}
      {canLogAttendance && (
        <Card className="border border-mid-gray/20 shadow-sm">
          <CardContent className="p-6">
            <h2 className="text-sm font-bold text-dark-gray uppercase tracking-wider mb-4">Log Attendance</h2>

            {booking.attendance !== null && !attendanceEdit ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
                    <Users className="w-6 h-6 text-green-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-black text-accent">{booking.attendance}</p>
                    <p className="text-xs text-dark-gray">Total Attendees</p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setAttendanceEdit(true)}
                  className="font-bold"
                >
                  Edit
                </Button>
              </div>
            ) : (
              <div className="flex items-end gap-3">
                <div className="flex-1 space-y-2">
                  <Label>Total Attendees</Label>
                  <Input
                    type="number"
                    min="0"
                    placeholder="e.g. 35"
                    value={attendanceValue}
                    onChange={(e) => setAttendanceValue(e.target.value)}
                  />
                </div>
                <Button
                  onClick={handleSaveAttendance}
                  className="bg-accent text-white hover:bg-accent/90 font-bold"
                  disabled={savingAttendance || !attendanceValue}
                >
                  {savingAttendance ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving...
                    </span>
                  ) : (
                    'Save Attendance'
                  )}
                </Button>
                {booking.attendance !== null && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setAttendanceEdit(false)
                      setAttendanceValue(String(booking.attendance))
                    }}
                  >
                    Cancel
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* 4. Cancel Booking */}
      {canCancel && (
        <Card className="border border-red-200 shadow-sm">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-red-600 uppercase tracking-wider">Danger Zone</h2>
              <p className="text-xs text-dark-gray mt-1">Cancelling a booking cannot be undone.</p>
            </div>
            <Button
              variant="outline"
              onClick={() => setCancelOpen(true)}
              className="border-red-300 text-red-600 hover:bg-red-50 font-bold"
            >
              Cancel Booking
            </Button>
          </CardContent>
        </Card>
      )}

      <ConfirmDialog
        isOpen={cancelOpen}
        title="Cancel Booking"
        description={`Are you sure you want to cancel your booking for ${booking.resource.name} on ${booking.date}? This action cannot be undone.`}
        confirmLabel="Yes, Cancel Booking"
        onConfirm={handleCancel}
        onCancel={() => setCancelOpen(false)}
      />
    </motion.div>
  )
}
