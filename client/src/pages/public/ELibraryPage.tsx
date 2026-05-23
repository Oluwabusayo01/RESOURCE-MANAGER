import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { format } from 'date-fns'
import { libraryService } from '@/lib/apiService'
import { useAuthStore } from '@/store/useAuthStore'
import type { LibraryMaterial } from '@/types'

import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'

import {
  FileText, FileType, Presentation, Download, Search, BookOpen,
  Upload, CloudUpload, X, CheckCircle, Loader2, ChevronLeft, ChevronRight,
} from 'lucide-react'
import { toast } from 'sonner'

const PER_PAGE = 9


const ALLOWED_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
]

const ALLOWED_EXTENSIONS = ['pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'txt']
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

const getFileIcon = (type: string) => {
  switch (type) {
    case 'pdf': return FileText
    case 'doc':
    case 'docx': return FileType
    case 'ppt':
    case 'pptx': return Presentation
    default: return FileText
  }
}

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function ELibraryPage() {
  const user = useAuthStore((s) => s.user)
  const canUpload = user && (user.role === 'staff' || user.role === 'admin')

  const [materials, setMaterials] = useState<LibraryMaterial[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)

  const [search, setSearch] = useState('')
  const [department, setDepartment] = useState('all')

  // Upload dialog state
  const [uploadOpen, setUploadOpen] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadSuccess, setUploadSuccess] = useState(false)
  const [dragOver, setDragOver] = useState(false)

  // Form fields
  const [file, setFile] = useState<File | null>(null)
  const [title, setTitle] = useState('')
  const [course, setCourse] = useState('')
  const [uploadDept, setUploadDept] = useState('')
  const [description, setDescription] = useState('')

  const fileInputRef = useRef<HTMLInputElement>(null)

  const fetchMaterials = useCallback(async (searchVal: string, deptVal: string) => {
    setLoading(true)
    try {
      const params: any = {}
      if (searchVal) params.search = searchVal
      if (deptVal !== 'all') params.department = deptVal
      const data = await libraryService.getAll(params)
      setMaterials(data)
    } catch (err) {
      console.error('Failed to load materials', err)
    } finally {
      setLoading(false)
    }
  }, [])

  // Fetch on mount
  useEffect(() => {
    fetchMaterials('', 'all')
  }, [fetchMaterials])

  // Debounced search
  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchMaterials(search, department)
      setPage(1)
    }, 300)
    return () => clearTimeout(timeout)
  }, [search, department, fetchMaterials])

  // Pagination logic
  const totalPages = Math.ceil(materials.length / PER_PAGE)
  const paginatedMaterials = materials.slice((page - 1) * PER_PAGE, page * PER_PAGE)


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

  // ---- Upload helpers ----

  const resetUploadForm = () => {
    setFile(null)
    setTitle('')
    setCourse('')
    setUploadDept('')
    setDescription('')
    setUploadSuccess(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleDialogClose = (open: boolean) => {
    if (!open) {
      // Small delay to let close animation finish before reset
      setTimeout(resetUploadForm, 200)
    }
    setUploadOpen(open)
  }

  const validateFile = (f: File): string | null => {
    const ext = f.name.split('.').pop()?.toLowerCase() || ''
    if (!ALLOWED_EXTENSIONS.includes(ext) && !ALLOWED_TYPES.includes(f.type)) {
      return `Unsupported file type. Allowed: ${ALLOWED_EXTENSIONS.join(', ').toUpperCase()}`
    }
    if (f.size > MAX_FILE_SIZE) {
      return `File too large (${formatFileSize(f.size)}). Maximum is 10 MB.`
    }
    return null
  }

  const handleFileSelect = (f: File) => {
    const error = validateFile(f)
    if (error) {
      toast.error(error)
      return
    }
    setFile(f)
    // Auto-fill title from file name if title is empty
    if (!title) {
      const nameWithoutExt = f.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ')
      setTitle(nameWithoutExt)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const dropped = e.dataTransfer.files[0]
    if (dropped) handleFileSelect(dropped)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
  }

  const handleUpload = async () => {
    if (!file) return toast.error('Please select a file.')
    if (!title.trim()) return toast.error('Please enter a title.')
    if (!course.trim()) return toast.error('Please enter a course code.')
    if (!uploadDept) return toast.error('Please select a department.')

    setUploading(true)
    try {
      // Step 1: Upload the file
      const uploadRes = await libraryService.uploadFile(file)
      const fileUrl = uploadRes.fileUrl || uploadRes.data?.fileUrl

      if (!fileUrl) {
        throw new Error('Failed to retrieve file URL from storage.')
      }

      // Step 2: Create material metadata
      const payload = {
        title: title.trim(),
        course: course.trim(),
        department: uploadDept,
        description: description.trim() || undefined,
        uploadedBy: user?.name || 'Staff Member',
        fileUrl,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.name.split('.').pop()?.toLowerCase() || 'pdf',
      }

      await libraryService.create(payload)
      
      setUploadSuccess(true)
      toast.success('Material uploaded successfully!')
      // Refresh the library listing
      fetchMaterials(search, department)
      // Auto-close after a beat
      setTimeout(() => {
        setUploadOpen(false)
        setTimeout(resetUploadForm, 200)
      }, 1500)
    } catch (err: any) {
      const msg = err?.response?.data?.message || err.message || 'Upload failed. Please try again.'
      toast.error(msg)
    } finally {
      setUploading(false)
    }
  }

  const fileExt = file?.name.split('.').pop()?.toLowerCase() || ''

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="container mx-auto px-4 py-12 max-w-6xl"
    >
      {/* 1. Page Header */}
      <div className="text-center mb-10">
        <h1 className="text-xl sm:text-4xl font-black text-accent mb-3">E-Library</h1>
        <p className="text-dark-gray text-xs sm:text-base max-w-lg mx-auto">
          Study materials uploaded by FCI lecturers. Free to browse and download.
        </p>
      </div>

      {/* 2. Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-10">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-mid-gray" />
          <Input
            placeholder="Search by title or course..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 h-10 text-sm"
          />
        </div>
        <Select value={department} onValueChange={setDepartment}>
          <SelectTrigger className="w-full sm:w-[220px] h-10 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Departments</SelectItem>
            <SelectItem value="computer science">Computer Science</SelectItem>
            <SelectItem value="cyber security">Cyber Security</SelectItem>
            <SelectItem value="information system">INS</SelectItem>
          </SelectContent>
        </Select>

        {/* Upload Button — only visible for staff / admin */}
        {canUpload && (
          <Button
            onClick={() => setUploadOpen(true)}
            className="h-10 bg-gold text-accent hover:bg-gold/90 font-bold gap-2 shadow-sm"
          >
            <Upload className="w-4 h-4" />
            Upload
          </Button>
        )}
      </div>

      {/* 3. Materials Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="bg-white rounded-xl border border-mid-gray/20 p-6 space-y-4">
              <Skeleton className="h-10 w-10 rounded-lg" />
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-10 w-full" />
            </div>
          ))}
        </div>
      ) : materials.length === 0 ? (
        <div className="text-center py-20">
          <BookOpen className="w-16 h-16 text-mid-gray mx-auto mb-4" />
          <p className="text-lg font-bold text-dark-gray">No materials found.</p>
          <p className="text-sm text-mid-gray mt-1">Try a different search.</p>
        </div>
      ) : (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {paginatedMaterials.map((m, i) => {
              const Icon = getFileIcon(m.fileType)
              return (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className="bg-white rounded-xl border border-mid-gray/20 p-6 shadow-sm hover:shadow-md hover:scale-[1.02] transition-all duration-200 flex flex-col animate-hover"
                >
                  {/* File Type Icon */}
                  <div className="w-12 h-12 bg-gold/10 rounded-lg flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6 text-gold" />
                  </div>

                  {/* Title & Course */}
                  <h3 className="text-lg font-black text-accent mb-1 line-clamp-2">{m.title}</h3>
                  <p className="text-sm text-dark-gray font-medium mb-2">{m.course}</p>

                  {/* Department Badge */}
                  <span className="inline-flex self-start text-[10px] font-bold px-2.5 py-1 bg-light-gray text-dark-gray rounded-full mb-3 uppercase tracking-wider">
                    {m.department}
                  </span>

                  {/* Description */}
                  {m.description && (
                    <p className="text-sm text-dark-gray mb-4 line-clamp-2 flex-1">{m.description}</p>
                  )}

                  {/* Uploader & Date */}
                  <div className="text-xs text-mid-gray mb-4 mt-auto">
                    <span>Uploaded by <span className="font-bold text-dark-gray">{m.uploadedBy}</span></span>
                    <span className="mx-1">·</span>
                    <span>{format(new Date(m.createdAt), 'MMM d, yyyy')}</span>
                  </div>

                  {/* Download Button */}
                  <Button
                    onClick={() => handleDownload(m)}
                    className="w-full bg-accent text-white hover:bg-accent/90 font-bold gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Download {m.fileType.toUpperCase()}
                  </Button>
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

      {/* ────────────── Upload Dialog ────────────── */}
      <Dialog open={uploadOpen} onOpenChange={handleDialogClose}>
        <DialogContent className="sm:max-w-[520px] w-[95vw] max-h-[85vh] flex flex-col overflow-hidden p-0 gap-0">
          {/* Decorative gradient header */}
          <div className="relative bg-gradient-to-br from-accent via-accent to-gold/40 px-6 pt-6 pb-5 shrink-0">
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_30%_20%,rgba(201,168,76,0.6),transparent_60%)]" />
            <DialogHeader className="relative z-10">
              <DialogTitle className="text-white text-xl font-black flex items-center gap-2">
                <CloudUpload className="w-6 h-6" />
                Upload Material
              </DialogTitle>
              <DialogDescription className="text-white/70 text-sm mt-1">
                Share study materials with FCI students.
              </DialogDescription>
            </DialogHeader>
          </div>

          <AnimatePresence mode="wait">
            {uploadSuccess ? (
              /* ── Success State ── */
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center py-14 px-6 overflow-y-auto flex-1"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
                >
                  <CheckCircle className="w-16 h-16 text-green-500 mb-4" />
                </motion.div>
                <p className="text-lg font-black text-accent">Upload Complete!</p>
                <p className="text-sm text-dark-gray mt-1">Your material is now live.</p>
              </motion.div>
            ) : (
              /* ── Upload Form ── */
              <motion.div
                key="form"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="px-6 pb-6 pt-5 space-y-5 overflow-y-auto flex-1 max-h-[55vh] sm:max-h-[60vh]"
              >
                {/* ── Drop Zone ── */}
                <div
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onClick={() => fileInputRef.current?.click()}
                  className={`
                    relative flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed
                    py-8 cursor-pointer transition-all duration-200
                    ${dragOver
                      ? 'border-gold bg-gold/5 scale-[1.01]'
                      : file
                        ? 'border-green-400 bg-green-50'
                        : 'border-mid-gray/40 bg-light-gray/50 hover:border-gold/60 hover:bg-gold/5'
                    }
                  `}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept={ALLOWED_EXTENSIONS.map(e => `.${e}`).join(',')}
                    onChange={(e) => {
                      const f = e.target.files?.[0]
                      if (f) handleFileSelect(f)
                    }}
                    className="hidden"
                  />

                  {file ? (
                    <>
                      <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                        {(() => { const FIcon = getFileIcon(fileExt); return <FIcon className="w-6 h-6 text-green-600" /> })()}
                      </div>
                      <p className="text-sm font-bold text-accent text-center line-clamp-1 max-w-[80%]">{file.name}</p>
                      <p className="text-xs text-dark-gray">{formatFileSize(file.size)} · {fileExt.toUpperCase()}</p>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setFile(null); if (fileInputRef.current) fileInputRef.current.value = '' }}
                        className="absolute top-2 right-2 p-1 rounded-full bg-white shadow hover:bg-red-50 transition-colors"
                      >
                        <X className="w-3.5 h-3.5 text-red-500" />
                      </button>
                    </>
                  ) : (
                    <>
                      <CloudUpload className={`w-10 h-10 transition-colors ${dragOver ? 'text-gold' : 'text-mid-gray'}`} />
                      <p className="text-sm font-bold text-dark-gray">
                        Drag & drop your file here
                      </p>
                      <p className="text-xs text-mid-gray">
                        or <span className="text-gold font-bold underline underline-offset-2">browse files</span> · Max 10 MB
                      </p>
                      <p className="text-[10px] text-mid-gray mt-1">
                        {ALLOWED_EXTENSIONS.map(e => e.toUpperCase()).join(', ')}
                      </p>
                    </>
                  )}
                </div>

                {/* ── Title ── */}
                <div className="space-y-1.5">
                  <Label htmlFor="upload-title" className="text-xs font-bold text-dark-gray">
                    Title <span className="text-red-400">*</span>
                  </Label>
                  <Input
                    id="upload-title"
                    placeholder="e.g. Introduction to Algorithms"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="h-10 text-sm"
                    disabled={uploading}
                  />
                </div>

                {/* ── Course + Department (side-by-side) ── */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="upload-course" className="text-xs font-bold text-dark-gray">
                      Course Code <span className="text-red-400">*</span>
                    </Label>
                    <Input
                      id="upload-course"
                      placeholder="e.g. CSC 201"
                      value={course}
                      onChange={(e) => setCourse(e.target.value)}
                      className="h-10 text-sm"
                      disabled={uploading}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-dark-gray">
                      Department <span className="text-red-400">*</span>
                    </Label>
                    <Select value={uploadDept} onValueChange={setUploadDept} disabled={uploading}>
                      <SelectTrigger className="h-10 text-sm">
                        <SelectValue placeholder="Select dept." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="computer science">Computer Science</SelectItem>
                        <SelectItem value="cyber security">Cyber Security</SelectItem>
                        <SelectItem value="information system">INS</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* ── Description (optional) ── */}
                <div className="space-y-1.5">
                  <Label htmlFor="upload-desc" className="text-xs font-bold text-dark-gray">
                    Description <span className="text-mid-gray font-normal">(optional)</span>
                  </Label>
                  <Textarea
                    id="upload-desc"
                    placeholder="Brief description of the material..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={2}
                    className="text-sm resize-none"
                    disabled={uploading}
                  />
                </div>

                {/* ── Submit Button ── */}
                <Button
                  onClick={handleUpload}
                  disabled={uploading || !file || !title.trim() || !course.trim() || !uploadDept}
                  className="w-full h-11 bg-accent text-white hover:bg-accent/90 font-bold gap-2 text-sm disabled:opacity-40"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Uploading…
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      Upload Material
                    </>
                  )}
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}
