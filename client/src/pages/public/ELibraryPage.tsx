import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { format } from 'date-fns'
import { libraryService } from '@/lib/apiService'
import type { LibraryMaterial } from '@/types'

import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

import { FileText, FileType, Presentation, Download, Search, BookOpen } from 'lucide-react'
import { toast } from 'sonner'

const getFileIcon = (type: string) => {
  switch (type) {
    case 'pdf': return FileText
    case 'docx': return FileType
    case 'pptx': return Presentation
    default: return FileText
  }
}

export default function ELibraryPage() {
  const [materials, setMaterials] = useState<LibraryMaterial[]>([])
  const [loading, setLoading] = useState(true)

  const [search, setSearch] = useState('')
  const [department, setDepartment] = useState('all')

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
    }, 300)
    return () => clearTimeout(timeout)
  }, [search, department, fetchMaterials])

  const handleDownload = async (material: LibraryMaterial) => {
    try {
      const result = await libraryService.download(material.id)
      if (result.fileUrl && result.fileUrl !== '#') {
        window.open(result.fileUrl, '_blank')
      } else {
        toast.success(`Downloading "${material.title}"...`)
      }
    } catch (err) {
      toast.error('Download failed.')
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="container mx-auto px-4 py-12 max-w-6xl"
    >
      {/* 1. Page Header */}
      <div className="text-center mb-10">
        <h1 className="text-4xl font-black text-accent mb-3">E-Library</h1>
        <p className="text-dark-gray max-w-lg mx-auto">
          Study materials uploaded by FCI lecturers. Free to browse and download.
        </p>
      </div>

      {/* 2. Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-4 mb-10">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-mid-gray" />
          <Input
            placeholder="Search by title or course..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={department} onValueChange={setDepartment}>
          <SelectTrigger className="w-full sm:w-[220px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Departments</SelectItem>
            <SelectItem value="Computer Science">Computer Science</SelectItem>
            <SelectItem value="Cyber Security">Cyber Security</SelectItem>
            <SelectItem value="Information Systems Sciences (INS)">INS</SelectItem>
          </SelectContent>
        </Select>
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {materials.map((m, i) => {
            const Icon = getFileIcon(m.fileType)
            return (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                className="bg-white rounded-xl border border-mid-gray/20 p-6 shadow-sm hover:shadow-md hover:scale-[1.02] transition-all duration-200 flex flex-col"
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
      )}
    </motion.div>
  )
}
