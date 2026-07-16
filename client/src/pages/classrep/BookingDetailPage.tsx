import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useParams, useNavigate } from 'react-router-dom'
import { bookingService } from '@/lib/apiService'
import { useAuthStore } from '@/store/useAuthStore'
import type { Booking } from '@/types'

import StatusBadge from '@/components/shared/StatusBadge'
import ConfirmDialog from '@/components/shared/ConfirmDialog'
import ResourceImage from '@/components/shared/ResourceImage'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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

const format12Hour = (timeStr: string) => {
  if (!timeStr) return ''
  const [hourStr, minStr] = timeStr.split(':')
  const hour = parseInt(hourStr, 10)
  const ampm = hour >= 12 ? 'PM' : 'AM'
  const hour12 = hour % 12 === 0 ? 12 : hour % 12
  const hourPad = hour12.toString().padStart(2, '0')
  return `${hourPad}:${minStr} ${ampm}`
}

const convertTo24h = (hour: string, minute: string, period: string): string => {
  if (!hour || !minute || !period) return ''
  let h = parseInt(hour, 10)
  if (period === 'PM' && h < 12) h += 12
  if (period === 'AM' && h === 12) h = 0
  return `${h.toString().padStart(2, '0')}:${minute}`
}

const parse24h = (timeStr: string) => {
  if (!timeStr) return { hour: '08', minute: '00', period: 'AM' }
  const [hStr, mStr] = timeStr.split(':')
  let h = parseInt(hStr, 10)
  let period = 'AM'
  if (h >= 12) {
    period = 'PM'
    if (h > 12) h -= 12
  }
  if (h === 0) h = 12
  return {
    hour: h.toString().padStart(2, '0'),
    minute: mStr || '00',
    period
  }
}

interface TimePickerProps {
  label: string
  value: string
  onChange: (val: string) => void
  error?: string
}

function TimePicker({ label, value, onChange, error }: TimePickerProps) {
  const { hour, minute, period } = parse24h(value)

  const handleHourChange = (newHour: string) => {
    onChange(convertTo24h(newHour, minute, period))
  }

  const handleMinuteChange = (newMinute: string) => {
    onChange(convertTo24h(hour, newMinute, period))
  }

  const handlePeriodChange = (newPeriod: string) => {
    onChange(convertTo24h(hour, minute, newPeriod))
  }

  const hours = Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, '0'))
  const minutes = Array.from({ length: 12 }, (_, i) => (i * 5).toString().padStart(2, '0'))

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex items-center gap-2">
        <Select value={hour} onValueChange={handleHourChange}>
          <SelectTrigger className="w-20">
            <SelectValue placeholder="HH" />
          </SelectTrigger>
          <SelectContent>
            {hours.map((h) => (
              <SelectItem key={h} value={h}>{h}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <span className="text-dark-gray font-semibold">:</span>

        <Select value={minute} onValueChange={handleMinuteChange}>
          <SelectTrigger className="w-20">
            <SelectValue placeholder="MM" />
          </SelectTrigger>
          <SelectContent>
            {minutes.map((m) => (
              <SelectItem key={m} value={m}>{m}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={period} onValueChange={handlePeriodChange}>
          <SelectTrigger className="w-24">
            <SelectValue placeholder="AM/PM" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="AM">AM</SelectItem>
            <SelectItem value="PM">PM</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}

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

  const [isEditingDetails, setIsEditingDetails] = useState(false)
  const [editCourse, setEditCourse] = useState('')
  const [editDate, setEditDate] = useState('')
  const [editStartTime, setEditStartTime] = useState('')
  const [editEndTime, setEditEndTime] = useState('')
  const [editNotes, setEditNotes] = useState('')
  const [savingDetails, setSavingDetails] = useState(false)

  const startEdit = () => {
    if (!booking) return
    setEditCourse(booking.course)
    setEditDate(booking.date)
    setEditStartTime(booking.startTime)
    setEditEndTime(booking.endTime)
    setEditNotes(booking.notes || '')
    setIsEditingDetails(true)
  }

  const handleSaveDetails = async () => {
    if (!id || !editCourse || !editDate || !editStartTime || !editEndTime) {
      toast.error('Please fill in all required fields.')
      return
    }

    if (editEndTime <= editStartTime) {
      toast.error('End time must be after start time.')
      return
    }

    setSavingDetails(true)
    try {
      await bookingService.update(id, {
        course: editCourse,
        date: editDate,
        startTime: editStartTime,
        endTime: editEndTime,
        notes: editNotes,
      })
      toast.success('Booking details updated successfully.')
      setIsEditingDetails(false)
      fetchBooking()
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Failed to update booking details.')
    } finally {
      setSavingDetails(false)
    }
  }

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
      if (window.history.length > 1) {
        navigate(-1)
      } else {
        navigate(user?.role === 'staff' ? '/staff/bookings' : '/classrep/bookings')
      }
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
        <Button
          onClick={() => {
            if (window.history.length > 1) {
              navigate(-1)
            } else {
              navigate(user?.role === 'staff' ? '/staff/bookings' : '/classrep/bookings')
            }
          }}
          className="bg-accent text-white"
        >
          Go Back
        </Button>
      </div>
    )
  }

  const isFuture = booking.date >= today
  const canCancel = booking.status === 'confirmed' && isFuture
  const canLogAttendance = (booking.status === 'confirmed' || booking.status === 'completed') && booking.date <= today
  const canEditDetails = booking.status === 'confirmed' && isFuture

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      {/* Back Button */}
      <button
        onClick={() => {
          if (window.history.length > 1) {
            navigate(-1)
          } else {
            navigate(user?.role === 'staff' ? '/staff/bookings' : '/classrep/bookings')
          }
        }}
        className="flex items-center gap-2 text-dark-gray hover:text-accent transition-colors text-sm font-medium"
      >
        <ArrowLeft className="w-4 h-4" />
        Go Back
      </button>
 
      {/* 1. Booking Info Card */}
      <Card className="border border-mid-gray/20 shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-start gap-4">
              <ResourceImage src={booking.resource?.image} name={booking.resource?.name || 'Unknown Resource'} type={booking.resource?.type || 'lab'} className="w-16 h-16 rounded-xl object-cover border border-mid-gray/20 shrink-0" />
              <div>
                <h1 className="text-2xl font-black text-accent">{booking.resource?.name || 'Unknown Resource'}</h1>
                <p className="text-dark-gray font-medium mt-1">{booking.course}</p>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <StatusBadge status={booking.status} />
              {canEditDetails && !isEditingDetails && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={startEdit}
                  className="font-bold border-mid-gray/30 hover:bg-light-gray h-8 text-xs"
                >
                  Edit Details
                </Button>
              )}
            </div>
          </div>

          {isEditingDetails ? (
            <div className="space-y-4">
              {/* Course Input */}
              <div className="space-y-2">
                <Label>Course Name</Label>
                <Input
                  value={editCourse}
                  onChange={(e) => setEditCourse(e.target.value)}
                  placeholder="e.g. CSC 401 - Software Engineering"
                />
              </div>

              {/* Date Input */}
              <div className="space-y-2">
                <Label>Date</Label>
                <Input
                  type="date"
                  value={editDate}
                  onChange={(e) => setEditDate(e.target.value)}
                  min={today}
                  onClick={(e) => e.currentTarget.showPicker()}
                />
              </div>

              {/* Time Range Pickers */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <TimePicker
                  label="Start Time"
                  value={editStartTime}
                  onChange={setEditStartTime}
                />
                <TimePicker
                  label="End Time"
                  value={editEndTime}
                  onChange={setEditEndTime}
                />
              </div>

              {/* Notes Input */}
              <div className="space-y-2">
                <Label>Notes (Optional)</Label>
                <Textarea
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder="Any specific requirements..."
                  rows={3}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-2">
                <Button
                  onClick={handleSaveDetails}
                  className="bg-accent text-white hover:bg-accent/90 font-bold h-10"
                  disabled={savingDetails}
                >
                  {savingDetails ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving...
                    </span>
                  ) : (
                    'Save Changes'
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsEditingDetails(false)}
                  disabled={savingDetails}
                  className="h-10"
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-light-gray rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <MapPin className="w-4 h-4 text-gold" />
                    <span className="text-[10px] font-bold text-dark-gray uppercase">Resource Type</span>
                  </div>
                  <p className="font-bold text-accent capitalize">{booking.resource?.type || 'lab'}</p>
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
                  <p className="font-bold text-accent">{format12Hour(booking.startTime)} – {format12Hour(booking.endTime)}</p>
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
            </>
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
        <Card className="border border-mid-gray/20 shadow-sm">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm text-dark-gray font-medium">Cancelling a booking cannot be undone.</p>
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
        description={`Are you sure you want to cancel your booking for ${booking.resource?.name || 'this resource'} on ${booking.date}? This action cannot be undone.`}
        confirmLabel="Yes, Cancel Booking"
        onConfirm={handleCancel}
        onCancel={() => setCancelOpen(false)}
      />
    </motion.div>
  )
}
