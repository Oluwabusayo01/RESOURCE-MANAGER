import { useState, useEffect } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import { resourceService, bookingService } from '@/lib/apiService'
import type { Resource } from '@/types'
import { toast } from 'sonner'
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react'
import { useAuthStore } from '@/store/useAuthStore'

const bookingSchema = z.object({
  resourceId: z.string().min(1, 'Resource is required'),
  date: z.string().min(1, 'Date is required'),
  startTime: z.string().min(1, 'Start time is required'),
  endTime: z.string().min(1, 'End time is required'),
  course: z.string().min(3, 'Course name must be at least 3 characters'),
  notes: z.string().optional(),
})

type BookingFormValues = z.infer<typeof bookingSchema>

interface BookingModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

export default function BookingModal({ isOpen, onClose, onSuccess }: BookingModalProps) {
  const { user } = useAuthStore()
  const [resources, setResources] = useState<Resource[]>([])
  const [checking, setChecking] = useState(false)
  const [available, setAvailable] = useState<boolean | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    control,
    setValue,
    reset,
    formState: { errors },
  } = useForm<BookingFormValues>({
    resolver: zodResolver(bookingSchema),
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

  // Fetch active resources
  useEffect(() => {
    if (isOpen) {
      resourceService.getAll({ status: 'active' })
        .then(setResources)
        .catch(err => console.error('Failed to load resources', err))
    }
  }, [isOpen])

  // Check availability when core fields change
  useEffect(() => {
    const check = async () => {
      if (resourceId && date && startTime && endTime) {
        if (startTime >= endTime) {
          setAvailable(null)
          return
        }
        
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
      await bookingService.create({
        ...data,
        userId: user?.id,
        userName: user?.name,
        department: user?.department
      })
      toast.success('Booking confirmed!')
      reset()
      onSuccess?.()
      onClose()
    } catch (err: any) {
      toast.error(err.message || 'Failed to create booking.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Book a Resource</DialogTitle>
          <DialogDescription>
            Fill in the details below to reserve a facility.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="resourceId">Resource</Label>
            <Select 
              onValueChange={(val) => setValue('resourceId', val)} 
              value={resourceId}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a lab or hall" />
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

          <div className="space-y-2">
            <Label htmlFor="date">Date</Label>
            <Input id="date" type="date" {...register('date')} min={new Date().toISOString().split('T')[0]} />
            {errors.date && <p className="text-xs text-red-500">{errors.date.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startTime">Start Time</Label>
              <Input id="startTime" type="time" {...register('startTime')} />
              {errors.startTime && <p className="text-xs text-red-500">{errors.startTime.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="endTime">End Time</Label>
              <Input id="endTime" type="time" {...register('endTime')} />
              {errors.endTime && <p className="text-xs text-red-500">{errors.endTime.message}</p>}
            </div>
          </div>

          {/* Availability Status */}
          <div className="h-6">
            {checking && (
              <div className="flex items-center gap-2 text-sm text-dark-gray">
                <Loader2 className="w-4 h-4 animate-spin" />
                Checking availability...
              </div>
            )}
            {!checking && available === true && (
              <div className="flex items-center gap-2 text-sm text-green-600">
                <CheckCircle2 className="w-4 h-4" />
                This resource is available.
              </div>
            )}
            {!checking && available === false && (
              <div className="flex items-center gap-2 text-sm text-red-500">
                <XCircle className="w-4 h-4" />
                This time slot is already taken. Please choose another.
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="course">Course Name</Label>
            <Input id="course" placeholder="e.g. CSC 401 - Software Engineering" {...register('course')} />
            {errors.course && <p className="text-xs text-red-500">{errors.course.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea id="notes" placeholder="Any specific requirements..." {...register('notes')} />
          </div>

          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="bg-accent text-white hover:bg-accent/90"
              disabled={submitting || available === false || checking}
            >
              {submitting ? 'Confirming...' : 'Confirm Booking'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
