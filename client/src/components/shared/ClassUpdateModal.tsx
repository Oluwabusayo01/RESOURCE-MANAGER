import { useState } from 'react'
import { useForm } from 'react-hook-form'
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
import { notificationService } from '@/lib/apiService'
import { useAuthStore } from '@/store/useAuthStore'
import { toast } from 'sonner'
import type { Department } from '@/types'

const updateSchema = z.object({
  title: z.string().min(3, 'Title is required'),
  message: z.string().min(10, 'Message must be at least 10 characters'),
  department: z.string().min(1, 'Department is required'),
})

type UpdateFormValues = z.infer<typeof updateSchema>

interface ClassUpdateModalProps {
  isOpen: boolean
  onClose: () => void
}

const departments: Department[] = [
  'Computer Science',
  'Cyber Security',
  'Information Systems Sciences (INS)',
]

export default function ClassUpdateModal({ isOpen, onClose }: ClassUpdateModalProps) {
  const { user } = useAuthStore()
  const [submitting, setSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<UpdateFormValues>({
    resolver: zodResolver(updateSchema),
    defaultValues: {
      title: '',
      message: '',
      department: user?.department || 'Computer Science',
    },
  })

  const onSubmit = async (data: UpdateFormValues) => {
    setSubmitting(true)
    try {
      await notificationService.pushClassUpdate({
        ...data,
        userId: user?.id,
      })
      toast.success('Update sent to the class!')
      reset()
      onClose()
    } catch (err: any) {
      toast.error('Failed to send update.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Push Class Update</DialogTitle>
          <DialogDescription>
            This will notify all students in the selected department.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input id="title" placeholder="e.g. Schedule Change for CSC 401" {...register('title')} />
            {errors.title && <p className="text-xs text-red-500">{errors.title.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="department">Department</Label>
            <Select 
              onValueChange={(val) => setValue('department', val)} 
              defaultValue={user?.department || 'Computer Science'}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Department" />
              </SelectTrigger>
              <SelectContent>
                {departments.map((d) => (
                  <SelectItem key={d} value={d}>{d}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.department && <p className="text-xs text-red-500">{errors.department.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Message</Label>
            <Textarea 
              id="message" 
              placeholder="Provide details about the update..." 
              rows={4}
              {...register('message')} 
            />
            {errors.message && <p className="text-xs text-red-500">{errors.message.message}</p>}
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
              disabled={submitting}
            >
              {submitting ? 'Sending...' : 'Send Update'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
