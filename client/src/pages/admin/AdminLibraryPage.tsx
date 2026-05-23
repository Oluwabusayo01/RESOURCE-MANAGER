import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { format } from 'date-fns'
import { libraryService } from '@/lib/apiService'
import type { LibraryMaterial } from '@/types'

import { Card, CardContent } from '@/components/ui/card'
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

import { BookOpen, Search, Download, FileText } from 'lucide-react'
import { toast } from 'sonner'

export default function AdminLibraryPage() {
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
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black text-accent flex items-center gap-3">
          <BookOpen className="w-8 h-8 text-gold" />
          E-Library Overview
        </h1>
        <p className="text-dark-gray text-sm mt-1">
          Monitor and browse all study materials uploaded across the faculty.
        </p>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-mid-gray" />
          <Input
            placeholder="Search by title or course..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 h-11 text-sm bg-white rounded-xl border-mid-gray/20 shadow-sm"
          />
        </div>
        
        <Select value={department} onValueChange={setDepartment}>
          <SelectTrigger className="w-full sm:w-[220px] h-11 text-sm bg-white rounded-xl border-mid-gray/20 shadow-sm">
            <SelectValue placeholder="All Departments" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Departments</SelectItem>
            <SelectItem value="computer science">Computer Science</SelectItem>
            <SelectItem value="cyber security">Cyber Security</SelectItem>
            <SelectItem value="information system">Information System (INS)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Materials Table Card */}
      <Card className="border border-mid-gray/20 shadow-sm overflow-hidden rounded-xl bg-white">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-4">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-14 w-full rounded-lg" />
              ))}
            </div>
          ) : materials.length === 0 ? (
            <div className="p-16 text-center">
              <BookOpen className="w-16 h-16 text-mid-gray mx-auto mb-4" />
              <p className="text-dark-gray font-bold text-lg">No materials found.</p>
              <p className="text-sm text-mid-gray mt-1">No items match the search query.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-light-gray/40">
                  <TableRow>
                    <TableHead className="font-bold py-4 pl-6 text-accent">Title</TableHead>
                    <TableHead className="font-bold py-4 text-accent">Course</TableHead>
                    <TableHead className="font-bold py-4 text-accent">Department</TableHead>
                    <TableHead className="font-bold py-4 text-accent">Uploaded By</TableHead>
                    <TableHead className="font-bold py-4 text-accent">Upload Date</TableHead>
                    <TableHead className="font-bold py-4 text-right pr-6 text-accent">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {materials.map((m) => (
                    <TableRow key={m.id} className="hover:bg-light-gray/20 border-b border-light-gray transition-colors">
                      <TableCell className="font-bold py-4 pl-6 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-gold/10 flex items-center justify-center shrink-0">
                          <FileText className="w-4.5 h-4.5 text-gold" />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate max-w-[200px] md:max-w-[280px] text-accent font-bold" title={m.title}>
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
                      <TableCell className="text-sm text-dark-gray py-4 font-semibold">{m.uploadedBy}</TableCell>
                      <TableCell className="text-sm text-mid-gray py-4">{format(new Date(m.createdAt), 'MMM d, yyyy')}</TableCell>
                      <TableCell className="py-4 text-right pr-6">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDownload(m)}
                          className="text-mid-gray hover:text-gold hover:bg-gold/10 w-9 h-9 rounded-lg"
                          title="Download file"
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}
