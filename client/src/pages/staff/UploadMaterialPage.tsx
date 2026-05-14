import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { format } from 'date-fns'
import { useAuthStore } from '@/store/useAuthStore'
import { libraryService } from '@/lib/apiService'
import type { LibraryMaterial } from '@/types'

import FileUploader from '@/components/shared/FileUploader'
import ConfirmDialog from '@/components/shared/ConfirmDialog'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

import { Upload, Trash2, Loader2, BookOpen } from 'lucide-react'
import { toast } from 'sonner'

const uploadSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  course: z.string().min(3, 'Course name must be at least 3 characters'),
  department: z.string().min(1, 'Department is required'),
  description: z.string().optional(),
})

interface UploadFormValues {
  title: string
  course: string
  department: string
  description?: string
}

export default function UploadMaterialPage() {
  const { user } = useAuthStore()

  const [materials, setMaterials] = useState<LibraryMaterial[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [fileError, setFileError] = useState<string | null>(null)

  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; id: string; title: string }>({
    open: false, id: '', title: '',
  })

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    watch,
    formState: { errors },
  } = useForm<UploadFormValues>({
    resolver: zodResolver(uploadSchema) as any,
    defaultValues: {
      title: '',
      course: '',
      department: '',
      description: '',
    },
  })

  const departmentValue = watch('department')

  const fetchMaterials = async () => {
    setLoading(true)
    try {
      const data = await libraryService.getAll({ uploadedById: user?.id })
      setMaterials(data)
    } catch (err) {
      console.error('Failed to load materials', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMaterials()
  }, [user?.id])

  const onSubmit = async (data: UploadFormValues) => {
    if (!selectedFile) {
      setFileError('Please upload a file.')
      return
    }
    setFileError(null)

    setSubmitting(true)
    try {
      const formData = new FormData()
      formData.append('title', data.title)
      formData.append('course', data.course)
      formData.append('department', data.department)
      formData.append('description', data.description || '')
      formData.append('uploadedBy', user?.name || '')
      formData.append('uploadedById', user?.id || '')
      formData.append('file', selectedFile)

      await libraryService.upload(formData)
      toast.success('Material uploaded successfully.')
      reset()
      setSelectedFile(null)
      fetchMaterials()
    } catch (err: any) {
      toast.error(err.message || 'Failed to upload material.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    try {
      await libraryService.delete(deleteDialog.id)
      toast.success('Material deleted.')
      setDeleteDialog({ open: false, id: '', title: '' })
      fetchMaterials()
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete material.')
    }
  }

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
          <Upload className="w-8 h-8 text-gold" />
          Upload Study Material
        </h1>
        <p className="text-dark-gray text-sm mt-1">Share lecture notes, slides, and documents with FCI students.</p>
      </div>

      {/* 1. Upload Form Card */}
      <Card className="border border-mid-gray/20 shadow-sm">
        <CardContent className="p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Title */}
              <div className="space-y-2">
                <Label>Title</Label>
                <Input placeholder="e.g. CSC 401 Lecture Notes" {...register('title')} />
                {errors.title && <p className="text-xs text-red-500">{errors.title.message}</p>}
              </div>

              {/* Course */}
              <div className="space-y-2">
                <Label>Course Name</Label>
                <Input placeholder="e.g. CSC 401 - Software Engineering" {...register('course')} />
                {errors.course && <p className="text-xs text-red-500">{errors.course.message}</p>}
              </div>
            </div>

            {/* Department */}
            <div className="space-y-2">
              <Label>Department</Label>
              <Select value={departmentValue} onValueChange={(val) => setValue('department', val, { shouldValidate: true })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="computer science">Computer Science</SelectItem>
                  <SelectItem value="cyber security">Cyber Security</SelectItem>
                  <SelectItem value="information systems sciences (ins)">Information Systems (INS)</SelectItem>
                </SelectContent>
              </Select>
              {errors.department && <p className="text-xs text-red-500">{errors.department.message}</p>}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label>Description (Optional)</Label>
              <Textarea placeholder="Brief description of the material..." {...register('description')} />
            </div>

            {/* File Upload */}
            <div className="space-y-2">
              <Label>File</Label>
              <FileUploader onChange={(file) => {
                setSelectedFile(file)
                if (file) setFileError(null)
              }} />
              {fileError && <p className="text-xs text-red-500">{fileError}</p>}
            </div>

            {/* Submit */}
            <Button
              type="submit"
              className="w-full bg-accent text-white hover:bg-accent/90 font-bold"
              disabled={submitting}
            >
              {submitting ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Uploading...
                </span>
              ) : (
                'Upload Material'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* 2. My Uploads Table */}
      <Card className="border border-mid-gray/20 shadow-sm overflow-hidden">
        <CardContent className="p-0">
          <div className="flex items-center justify-between p-5 border-b">
            <h2 className="text-lg font-black text-accent">My Uploads</h2>
            {!loading && (
              <span className="text-xs font-bold text-dark-gray bg-light-gray px-3 py-1 rounded-full">
                {materials.length} material{materials.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>

          {loading ? (
            <div className="p-5 space-y-4">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : materials.length === 0 ? (
            <div className="p-12 text-center">
              <BookOpen className="w-12 h-12 text-mid-gray mx-auto mb-3" />
              <p className="text-dark-gray font-medium">You haven't uploaded any materials yet.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-bold">Title</TableHead>
                  <TableHead className="font-bold">Course</TableHead>
                  <TableHead className="font-bold">Department</TableHead>
                  <TableHead className="font-bold">Upload Date</TableHead>
                  <TableHead className="font-bold text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {materials.map((m) => (
                  <TableRow key={m.id} className="hover:bg-light-gray/50">
                    <TableCell className="font-bold">{m.title}</TableCell>
                    <TableCell className="text-dark-gray text-sm">{m.course}</TableCell>
                    <TableCell className="text-sm">{m.department}</TableCell>
                    <TableCell className="text-sm">{format(new Date(m.createdAt), 'MMM d, yyyy')}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteDialog({ open: true, id: m.id, title: m.title })}
                        className="text-red-500 hover:text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirm */}
      <ConfirmDialog
        isOpen={deleteDialog.open}
        title="Delete Material"
        description={`Are you sure you want to delete "${deleteDialog.title}"? This action cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setDeleteDialog({ open: false, id: '', title: '' })}
      />
    </motion.div>
  )
}
