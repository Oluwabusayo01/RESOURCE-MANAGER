import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useAuthStore } from '@/store/useAuthStore'
import { resourceService, bookingService } from '@/lib/apiService'
import type { Resource } from '@/types'
import { useBookingReminder } from '@/lib/useBookingReminder'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

import { CheckCircle2, XCircle, Loader2, CalendarPlus } from 'lucide-react'
import { toast } from 'sonner'

const bookingSchema = z.object({
  resourceId: z.string().min(1, 'Please select a resource'),
  date: z.string().min(1, 'Date is required'),
  startTime: z.string().min(1, 'Start time is required'),
  endTime: z.string().min(1, 'End time is required'),
  course: z.string().min(3, 'Course name must be at least 3 characters'),
  notes: z.string().optional(),
}).refine((data) => data.endTime > data.startTime, {
  message: 'End time must be after start time',
  path: ['endTime'],
})

interface BookingFormValues {
  resourceId: string
  date: string
  startTime: string
  endTime: string
  course: string
  notes?: string
}

export default function BookingPage() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const { scheduleReminder } = useBookingReminder()

  const [resources, setResources] = useState<Resource[]>([])
  const [checking, setChecking] = useState(false)
  const [available, setAvailable] = useState<boolean | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors },
  } = useForm<BookingFormValues>({
    resolver: zodResolver(bookingSchema) as any,
    defaultValues: {
      resourceId: '',
      date: new Date().toISOString().split('T')[0],
      startTime: '',
      endTime: '',
      course: '',
      notes: '',
    },
  })

  const resourceId = useWatch({ control, name: 'resourceId' })
  const date = useWatch({ control, name: 'date' })
  const startTime = useWatch({ control, name: 'startTime' })
  const endTime = useWatch({ control, name: 'endTime' })

  // Fetch active resources on mount
  useEffect(() => {
    resourceService.getAll({ status: 'active' })
      .then(setResources)
      .catch(err => console.error('Failed to load resources', err))
  }, [])

  // Check availability when fields change
  useEffect(() => {
    const check = async () => {
      if (resourceId && date && startTime && endTime && endTime > startTime) {
        setChecking(true)
        try {
          const res = await resourceService.checkAvailability(resourceId, { date, startTime, endTime })
          setAvailable(res.available)
        } catch (err) {
          console.error('Availability check failed', err)
          setAvailable(null)
        } finally {
          setChecking(false)
        }
      } else {
        setAvailable(null)
      }
    }

    const timeoutId = setTimeout(check, 500)
    return () => clearTimeout(timeoutId)
  }, [resourceId, date, startTime, endTime])

  const onSubmit = async (data: BookingFormValues) => {
    if (available === false) {
      toast.error('This time slot is already taken.')
      return
    }

    setSubmitting(true)
    try {
      const resource = resources.find(r => r.id === data.resourceId)
      const newBooking = await bookingService.create({
        ...data,
        userId: user?.id,
        user: { id: user?.id, name: user?.name, role: user?.role, department: user?.department },
        resource,
        department: user?.department,
      })
      toast.success('Booking confirmed!')

      // Schedule auto-reminder 1 hour before booking
      if (resource) {
        scheduleReminder({ ...newBooking, resource, course: data.course, date: data.date, startTime: data.startTime })
      }

      // Navigate to the correct dashboard based on role
      const dashboardPath = user?.role === 'staff' ? '/staff/dashboard' : '/classrep/dashboard'
      navigate(dashboardPath)
    } catch (err: any) {
      const message = err.message || 'Failed to create booking.'
      toast.error(message)
    } finally {
      setSubmitting(false)
    }
  }

  const todayStr = new Date().toISOString().split('T')[0]

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-8"
    >
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black text-accent flex items-center gap-3">
          <CalendarPlus className="w-8 h-8 text-gold" />
          Book a Resource
        </h1>
        <p className="text-dark-gray text-sm mt-1">Reserve a lab, seminar room, or hall for your class.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Card */}
        <Card className="lg:col-span-2 border border-mid-gray/20 shadow-sm">
          <CardContent className="p-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              {/* Resource Select */}
              <div className="space-y-2">
                <Label>Resource</Label>
                <Select onValueChange={(val) => setValue('resourceId', val, { shouldValidate: true })} value={resourceId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a lab, hall, or room" />
                  </SelectTrigger>
                  <SelectContent>
                    {resources.map((r) => (
                      <SelectItem key={r.id} value={r.id}>
                        {r.name} {r.capacity ? `(${r.capacity} seats)` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.resourceId && <p className="text-xs text-red-500">{errors.resourceId.message}</p>}
              </div>

              {/* Date */}
              <div className="space-y-2">
                <Label>Date</Label>
                <Input type="date" {...register('date')} min={todayStr} />
                {errors.date && <p className="text-xs text-red-500">{errors.date.message}</p>}
              </div>

              {/* Time Range */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start Time</Label>
                  <Input type="time" {...register('startTime')} />
                  {errors.startTime && <p className="text-xs text-red-500">{errors.startTime.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label>End Time</Label>
                  <Input type="time" {...register('endTime')} />
                  {errors.endTime && <p className="text-xs text-red-500">{errors.endTime.message}</p>}
                </div>
              </div>

              {/* Course Name */}
              <div className="space-y-2">
                <Label>Course Name</Label>
                <Input placeholder="e.g. CSC 401 - Software Engineering" {...register('course')} />
                {errors.course && <p className="text-xs text-red-500">{errors.course.message}</p>}
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label>Notes (Optional)</Label>
                <Textarea placeholder="Any specific requirements..." {...register('notes')} />
              </div>

              {/* Submit */}
              <Button
                type="submit"
                className="w-full bg-accent text-white hover:bg-accent/90 font-bold"
                disabled={submitting || available === false || checking}
              >
                {submitting ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Confirming...
                  </span>
                ) : (
                  'Confirm Booking'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Availability Panel */}
        <Card className="border border-mid-gray/20 shadow-sm h-fit sticky top-8">
          <CardContent className="p-6">
            <h3 className="text-sm font-bold text-dark-gray uppercase tracking-wider mb-4">Availability Status</h3>

            {!resourceId || !date || !startTime || !endTime ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-light-gray rounded-full flex items-center justify-center mx-auto mb-4">
                  <CalendarPlus className="w-8 h-8 text-mid-gray" />
                </div>
                <p className="text-sm text-dark-gray">Select a resource, date, and time to check availability.</p>
              </div>
            ) : checking ? (
              <div className="text-center py-8">
                <Loader2 className="w-8 h-8 text-gold animate-spin mx-auto mb-4" />
                <p className="text-sm text-dark-gray font-medium">Checking availability...</p>
              </div>
            ) : available === true ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-8 h-8 text-green-500" />
                </div>
                <p className="text-sm font-bold text-green-600">This resource is available.</p>
                <p className="text-xs text-dark-gray mt-1">You can proceed to confirm your booking.</p>
              </div>
            ) : available === false ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <XCircle className="w-8 h-8 text-red-500" />
                </div>
                <p className="text-sm font-bold text-red-600">This time slot is already taken.</p>
                <p className="text-xs text-dark-gray mt-1">Please choose another time or resource.</p>
              </div>
            ) : null}

            {/* Selected Resource Info */}
            {resourceId && (
              <div className="mt-6 pt-4 border-t border-mid-gray/20 space-y-2">
                <h4 className="text-xs font-bold text-dark-gray uppercase">Selected Resource</h4>
                {(() => {
                  const r = resources.find(res => res.id === resourceId)
                  if (!r) return null
                  return (
                    <div className="bg-light-gray rounded-lg p-3 space-y-1">
                      <p className="font-bold text-accent text-sm">{r.name}</p>
                      <p className="text-xs text-dark-gray capitalize">{r.type} {r.capacity ? `· ${r.capacity} seats` : ''}</p>
                    </div>
                  )
                })()}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </motion.div>
  )
}
