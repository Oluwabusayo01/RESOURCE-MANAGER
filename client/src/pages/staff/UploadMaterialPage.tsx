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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

import { Upload, Trash2, Loader2, BookOpen, Plus, Search, Edit2, Download, FileText } from 'lucide-react'
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
  const [searchQuery, setSearchQuery] = useState('')

  // Modal State
  const [modalOpen, setModalOpen] = useState(false)
  const [editingMaterial, setEditingMaterial] = useState<LibraryMaterial | null>(null)

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
      const data = await libraryService.getStaffLibrary()
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

  // Open modal in Create mode
  const handleOpenCreate = () => {
    setEditingMaterial(null)
    setSelectedFile(null)
    setFileError(null)
    reset({
      title: '',
      course: '',
      department: user?.department || '',
      description: '',
    })
    setModalOpen(true)
  }

  // Open modal in Edit mode
  const handleOpenEdit = (material: LibraryMaterial) => {
    setEditingMaterial(material)
    setSelectedFile(null)
    setFileError(null)
    reset({
      title: material.title,
      course: material.course,
      department: material.department,
      description: material.description || '',
    })
    setModalOpen(true)
  }

  const onSubmit = async (data: UploadFormValues) => {
    if (!editingMaterial && !selectedFile) {
      setFileError('Please upload a file.')
      return
    }
    setFileError(null)

    setSubmitting(true)
    try {
      let fileUrl = editingMaterial?.fileUrl || ''
      let fileName = editingMaterial?.fileName || ''
      let fileSize = editingMaterial?.fileSize || 0
      let fileType = editingMaterial?.fileType || ''

      // Step 1: Check if file changed and upload first
      if (selectedFile) {
        const uploadRes = await libraryService.uploadFile(selectedFile)
        fileUrl = uploadRes.fileUrl || uploadRes.data?.fileUrl
        fileName = selectedFile.name
        fileSize = selectedFile.size
        fileType = selectedFile.name.split('.').pop()?.toLowerCase() || 'pdf'

        if (!fileUrl) {
          throw new Error('Failed to retrieve file URL from storage.')
        }
      }

      // Step 2: Create or Update Metadata
      const payload = {
        title: data.title.trim(),
        course: data.course.trim(),
        department: data.department,
        description: data.description?.trim() || undefined,
        uploadedBy: user?.name || 'Staff Member',
        fileUrl,
        fileName,
        fileSize,
        fileType,
      }

      if (editingMaterial) {
        await libraryService.update(editingMaterial.id, payload)
        toast.success('Material updated successfully.')
      } else {
        await libraryService.create(payload)
        toast.success('Material uploaded successfully.')
      }

      setModalOpen(false)
      reset()
      setSelectedFile(null)
      fetchMaterials()
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Failed to save material.')
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

  const handleDownload = async (material: LibraryMaterial) => {
    try {
      toast.loading(`Downloading "${material.title}"...`, { id: 'download' })
      const response = await libraryService.downloadFile(material.fileUrl)
      const blob = new Blob([response], { type: 'application/octet-stream' })
      const downloadUrl = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = downloadUrl
      link.setAttribute('download', material.fileName || `${material.title}.${material.fileType}`)
      document.body.appendChild(link)
      link.click()
      link.parentNode?.removeChild(link)
      window.URL.revokeObjectURL(downloadUrl)
      toast.success(`Downloaded "${material.title}"`, { id: 'download' })
    } catch (err) {
      console.error('Blob download failed, trying direct link...', err)
      try {
        const token = localStorage.getItem('rm_token')
        const directUrl = `${import.meta.env.VITE_API_BASE_URL}/library/download-file?fileUrl=${encodeURIComponent(material.fileUrl)}&token=${token}`
        window.open(directUrl, '_blank')
        toast.success(`Downloading "${material.title}"...`, { id: 'download' })
      } catch (fallbackErr) {
        toast.error('Download failed.', { id: 'download' })
      }
    }
  }

  // Filter in-memory for premium feel
  const filteredMaterials = materials.filter(m =>
    m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.course.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.department.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const getFileTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'pdf': return 'bg-red-100 text-red-700'
      case 'doc':
      case 'docx': return 'bg-blue-100 text-blue-700'
      case 'ppt':
      case 'pptx': return 'bg-orange-100 text-orange-700'
      case 'xls':
      case 'xlsx': return 'bg-green-100 text-green-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6 max-w-6xl mx-auto"
    >
      {/* Header and Action Button */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-accent flex items-center gap-3">
            <BookOpen className="w-8 h-8 text-gold" />
            Materials
          </h1>
          <p className="text-dark-gray text-sm mt-1">Manage, upload and share study materials with students.</p>
        </div>
        <Button
          onClick={handleOpenCreate}
          className="bg-gold text-accent hover:bg-gold/90 font-bold gap-2 px-5 py-6 shadow-sm rounded-xl cursor-pointer"
        >
          <Plus className="w-5 h-5" />
          Upload Material
        </Button>
      </div>

      {/* Search & Stats bar */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-mid-gray" />
          <Input
            placeholder="Search by title, course, or department..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-11 text-sm bg-white rounded-xl border-mid-gray/20 shadow-sm"
          />
        </div>
        {!loading && (
          <span className="text-xs font-bold text-dark-gray bg-white border border-mid-gray/10 px-4 py-2 rounded-xl shadow-sm self-stretch sm:self-auto flex items-center justify-center">
            {filteredMaterials.length} material{filteredMaterials.length !== 1 ? 's' : ''} uploaded
          </span>
        )}
      </div>

      {/* Materials Table View */}
      <Card className="border border-mid-gray/20 shadow-sm overflow-hidden rounded-xl bg-white">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-4">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-14 w-full rounded-lg" />
              ))}
            </div>
          ) : filteredMaterials.length === 0 ? (
            <div className="p-16 text-center">
              <BookOpen className="w-16 h-16 text-mid-gray mx-auto mb-4" />
              <p className="text-dark-gray font-bold text-lg">No materials found.</p>
              <p className="text-sm text-mid-gray mt-1">
                {searchQuery ? 'Try matching a different keyword.' : 'Click "Upload Material" to share your first document.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-light-gray/40">
                  <TableRow>
                    <TableHead className="font-bold py-4 pl-6 text-accent">Title</TableHead>
                    <TableHead className="font-bold py-4 text-accent">Course</TableHead>
                    <TableHead className="font-bold py-4 text-accent">Department</TableHead>
                    <TableHead className="font-bold py-4 text-accent">Upload Date</TableHead>
                    <TableHead className="font-bold py-4 text-right pr-6 text-accent">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMaterials.map((m) => (
                    <TableRow key={m.id} className="hover:bg-light-gray/20 border-b border-light-gray transition-colors">
                      <TableCell className="font-bold py-4 pl-6 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-gold/10 flex items-center justify-center shrink-0">
                          <FileText className="w-4.5 h-4.5 text-gold" />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate max-w-[260px] md:max-w-[340px] text-accent font-bold" title={m.title}>
                            {m.title}
                          </p>
                          <span className={`inline-block text-[9px] font-black uppercase px-2 py-0.5 mt-1 rounded ${getFileTypeColor(m.fileType)}`}>
                            {m.fileType}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-dark-gray font-medium py-4">{m.course}</TableCell>
                      <TableCell className="text-sm py-4 uppercase text-dark-gray tracking-wider font-semibold text-[10px]">
                        {m.department}
                      </TableCell>
                      <TableCell className="text-sm text-mid-gray py-4">{format(new Date(m.createdAt), 'MMM d, yyyy')}</TableCell>
                      <TableCell className="py-4 text-right pr-6">
                        <div className="flex justify-end gap-1.5">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDownload(m)}
                            className="text-mid-gray hover:text-gold hover:bg-gold/10 w-9 h-9 rounded-lg"
                            title="Download file"
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenEdit(m)}
                            className="text-mid-gray hover:text-accent hover:bg-accent/10 w-9 h-9 rounded-lg"
                            title="Edit details"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteDialog({ open: true, id: m.id, title: m.title })}
                            className="text-red-500 hover:text-red-600 hover:bg-red-50 w-9 h-9 rounded-lg"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add / Edit Dialog Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-[540px] w-[95vw] max-h-[90vh] flex flex-col overflow-hidden p-0 gap-0 rounded-2xl border border-mid-gray/10 shadow-2xl">
          {/* Modal Header */}
          <div className="bg-gradient-to-r from-accent to-accent/90 px-6 py-5 shrink-0 text-white relative">
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_70%_20%,#C9A84C,transparent_60%)]" />
            <DialogHeader className="relative z-10 text-left">
              <DialogTitle className="text-white text-xl font-black flex items-center gap-2">
                <Upload className="w-5.5 h-5.5 text-gold animate-bounce" />
                {editingMaterial ? 'Edit Study Material' : 'Upload Study Material'}
              </DialogTitle>
              <DialogDescription className="text-white/70 text-sm mt-1">
                {editingMaterial ? 'Update the details or files of this course material.' : 'Select a document and fill in details to publish.'}
              </DialogDescription>
            </DialogHeader>
          </div>

          {/* Form Content */}
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col flex-1 overflow-hidden">
            <div className="px-6 py-5 space-y-4 overflow-y-auto flex-1 max-h-[55vh] sm:max-h-[60vh]">
              {/* File Uploader */}
              <div className="space-y-2">
                <Label className="text-xs font-bold text-accent uppercase tracking-wider">Document File</Label>
                <FileUploader
                  onChange={(file) => {
                    setSelectedFile(file)
                    if (file) setFileError(null)
                  }}
                  existingFileName={editingMaterial?.fileName || editingMaterial?.title}
                  existingFileSize={editingMaterial?.fileSize}
                />
                {fileError && <p className="text-xs text-red-500 font-semibold">{fileError}</p>}
              </div>

              {/* Title */}
              <div className="space-y-1.5">
                <Label htmlFor="title" className="text-xs font-bold text-accent uppercase tracking-wider">Title</Label>
                <Input
                  id="title"
                  placeholder="e.g. Introduction to Artificial Intelligence"
                  {...register('title')}
                  disabled={submitting}
                  className="rounded-xl border-mid-gray/20 focus:border-gold h-10.5 text-sm"
                />
                {errors.title && <p className="text-xs text-red-500">{errors.title.message}</p>}
              </div>

              {/* Course & Department */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="course" className="text-xs font-bold text-accent uppercase tracking-wider">Course Code</Label>
                  <Input
                    id="course"
                    placeholder="e.g. CSC 201"
                    {...register('course')}
                    disabled={submitting}
                    className="rounded-xl border-mid-gray/20 focus:border-gold h-10.5 text-sm"
                  />
                  {errors.course && <p className="text-xs text-red-500">{errors.course.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-accent uppercase tracking-wider">Department</Label>
                  <Select
                    value={departmentValue}
                    onValueChange={(val) => setValue('department', val, { shouldValidate: true })}
                    disabled={submitting}
                  >
                    <SelectTrigger className="rounded-xl border-mid-gray/20 h-10.5 text-sm">
                      <SelectValue placeholder="Select Department" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="computer science">Computer Science</SelectItem>
                      <SelectItem value="cyber security">Cyber Security</SelectItem>
                      <SelectItem value="information system">Information System (INS)</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.department && <p className="text-xs text-red-500">{errors.department.message}</p>}
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <Label htmlFor="description" className="text-xs font-bold text-accent uppercase tracking-wider">Description (Optional)</Label>
                <Textarea
                  id="description"
                  placeholder="A brief description of topics covered..."
                  rows={2}
                  {...register('description')}
                  disabled={submitting}
                  className="rounded-xl border-mid-gray/20 focus:border-gold text-sm resize-none"
                />
              </div>
            </div>

            {/* Form Actions Footer */}
            <div className="px-6 py-4 bg-light-gray/40 border-t flex items-center justify-end gap-3 shrink-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => setModalOpen(false)}
                disabled={submitting}
                className="rounded-xl px-5 h-11 text-sm font-bold border-mid-gray/20 text-dark-gray"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="bg-accent text-white hover:bg-accent/90 font-bold px-6 h-11 text-sm rounded-xl gap-2 cursor-pointer shadow-md min-w-[120px]"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving…
                  </>
                ) : editingMaterial ? (
                  'Save Changes'
                ) : (
                  'Upload Material'
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={deleteDialog.open}
        title="Delete Material"
        description={`Are you sure you want to delete "${deleteDialog.title}"? This will permanently remove the document from the e-library. This action cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setDeleteDialog({ open: false, id: '', title: '' })}
      />
    </motion.div>
  )
}
