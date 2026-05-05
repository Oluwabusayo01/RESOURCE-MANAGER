import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { bookingService, resourceService } from '@/lib/apiService'
import type { Booking, Resource } from '@/types'

import StatusBadge from '@/components/shared/StatusBadge'
import ConfirmDialog from '@/components/shared/ConfirmDialog'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
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
  Eye,
  XCircle,
  Trash2,
  Download,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  CalendarCheck,
  Calendar,
  Clock,
  MapPin,
  BookOpen,
  User,
} from 'lucide-react'
import { toast } from 'sonner'

const PER_PAGE = 10

export default function AllBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [resources, setResources] = useState<Resource[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)

  // Filters
  const [resourceFilter, setResourceFilter] = useState('all')
  const [deptFilter, setDeptFilter] = useState('all')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')

  // View dialog
  const [viewBooking, setViewBooking] = useState<Booking | null>(null)

  // Confirm dialogs
  const [cancelDialog, setCancelDialog] = useState<{ open: boolean; id: string; name: string }>({ open: false, id: '', name: '' })
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; id: string; name: string }>({ open: false, id: '', name: '' })

  const fetchData = async () => {
    setLoading(true)
    try {
      const params: any = {}
      if (resourceFilter !== 'all') params.resourceId = resourceFilter
      if (deptFilter !== 'all') params.department = deptFilter
      if (fromDate) params.from = fromDate
      if (toDate) params.to = toDate

      const [bookingsData, resourcesData] = await Promise.all([
        bookingService.getAll(params),
        resourceService.getAll(),
      ])
      setBookings(bookingsData)
      setResources(resourcesData)
      setPage(1)
    } catch (err) {
      console.error('Failed to load bookings', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [resourceFilter, deptFilter, fromDate, toDate])

  const resetFilters = () => {
    setResourceFilter('all')
    setDeptFilter('all')
    setFromDate('')
    setToDate('')
  }

  // Pagination
  const totalPages = Math.ceil(bookings.length / PER_PAGE)
  const paginatedBookings = bookings.slice((page - 1) * PER_PAGE, page * PER_PAGE)

  const handleCancel = async () => {
    try {
      await bookingService.cancel(cancelDialog.id)
      toast.success('Booking cancelled.')
      setCancelDialog({ open: false, id: '', name: '' })
      fetchData()
    } catch (err: any) {
      toast.error(err.message || 'Failed to cancel booking.')
    }
  }

  const handleDelete = async () => {
    try {
      await bookingService.delete(deleteDialog.id)
      toast.success('Booking deleted.')
      setDeleteDialog({ open: false, id: '', name: '' })
      fetchData()
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete booking.')
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-accent">All Bookings</h1>
          <p className="text-dark-gray text-sm mt-1">View and manage all resource bookings across FCI.</p>
        </div>
        <Button
          variant="outline"
          onClick={() => toast.info('Export feature coming soon.')}
          className="gap-2 font-bold text-dark-gray"
        >
          <Download className="w-4 h-4" />
          Export
        </Button>
      </div>

      {/* 1. Filter Bar */}
      <Card className="border border-mid-gray/20 shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-end gap-4">
            <div className="space-y-1 min-w-[180px]">
              <p className="text-xs font-bold text-dark-gray uppercase">Resource</p>
              <Select value={resourceFilter} onValueChange={setResourceFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Resources</SelectItem>
                  {resources.map(r => (
                    <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1 min-w-[180px]">
              <p className="text-xs font-bold text-dark-gray uppercase">Department</p>
              <Select value={deptFilter} onValueChange={setDeptFilter}>
                <SelectTrigger>
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

            <div className="space-y-1">
              <p className="text-xs font-bold text-dark-gray uppercase">From Date</p>
              <Input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} className="w-[160px]" />
            </div>

            <div className="space-y-1">
              <p className="text-xs font-bold text-dark-gray uppercase">To Date</p>
              <Input type="date" value={toDate} onChange={e => setToDate(e.target.value)} className="w-[160px]" />
            </div>

            <Button variant="outline" size="sm" onClick={resetFilters} className="gap-1 font-bold text-dark-gray">
              <RotateCcw className="w-3 h-3" />
              Reset
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 2. Bookings Table */}
      <Card className="border border-mid-gray/20 shadow-sm overflow-hidden">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-5 space-y-4">
              {[1, 2, 3, 4, 5].map(i => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : bookings.length === 0 ? (
            <div className="p-12 text-center">
              <CalendarCheck className="w-12 h-12 text-mid-gray mx-auto mb-3" />
              <p className="text-dark-gray font-medium">No bookings found.</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-bold">Resource</TableHead>
                    <TableHead className="font-bold">Booked By</TableHead>
                    <TableHead className="font-bold">Course</TableHead>
                    <TableHead className="font-bold">Department</TableHead>
                    <TableHead className="font-bold">Date</TableHead>
                    <TableHead className="font-bold">Time</TableHead>
                    <TableHead className="font-bold">Status</TableHead>
                    <TableHead className="font-bold text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedBookings.map((b) => (
                    <TableRow key={b.id} className="hover:bg-light-gray/50">
                      <TableCell className="font-bold">{b.resource.name}</TableCell>
                      <TableCell className="text-dark-gray text-sm">{b.user?.name || 'Unknown'}</TableCell>
                      <TableCell className="text-sm">{b.course}</TableCell>
                      <TableCell className="text-sm">{b.department}</TableCell>
                      <TableCell className="text-sm">{b.date}</TableCell>
                      <TableCell className="text-sm">{b.startTime} – {b.endTime}</TableCell>
                      <TableCell><StatusBadge status={b.status} /></TableCell>
                      <TableCell className="text-right space-x-1">
                        <Button variant="ghost" size="sm" onClick={() => setViewBooking(b)} className="text-accent">
                          <Eye className="w-4 h-4" />
                        </Button>
                        {b.status === 'confirmed' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setCancelDialog({ open: true, id: b.id, name: b.resource.name })}
                            className="text-red-500"
                          >
                            <XCircle className="w-4 h-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteDialog({ open: true, id: b.id, name: b.resource.name })}
                          className="text-red-500"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between p-4 border-t">
                  <p className="text-xs text-dark-gray">
                    Showing {(page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, bookings.length)} of {bookings.length}
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
            </>
          )}
        </CardContent>
      </Card>

      {/* View Booking Dialog */}
      <Dialog open={!!viewBooking} onOpenChange={(open) => !open && setViewBooking(null)}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Booking Details</DialogTitle>
            <DialogDescription>Full information about this booking.</DialogDescription>
          </DialogHeader>

          {viewBooking && (
            <div className="space-y-4 py-4">
              <div className="flex items-start justify-between">
                <h3 className="text-xl font-black text-accent">{viewBooking.resource.name}</h3>
                <StatusBadge status={viewBooking.status} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-light-gray rounded-lg p-3">
                  <div className="flex items-center gap-1 mb-1">
                    <BookOpen className="w-3 h-3 text-gold" />
                    <span className="text-[10px] font-bold text-dark-gray uppercase">Course</span>
                  </div>
                  <p className="text-sm font-bold text-accent">{viewBooking.course}</p>
                </div>
                <div className="bg-light-gray rounded-lg p-3">
                  <div className="flex items-center gap-1 mb-1">
                    <MapPin className="w-3 h-3 text-gold" />
                    <span className="text-[10px] font-bold text-dark-gray uppercase">Department</span>
                  </div>
                  <p className="text-sm font-bold text-accent">{viewBooking.department}</p>
                </div>
                <div className="bg-light-gray rounded-lg p-3">
                  <div className="flex items-center gap-1 mb-1">
                    <Calendar className="w-3 h-3 text-gold" />
                    <span className="text-[10px] font-bold text-dark-gray uppercase">Date</span>
                  </div>
                  <p className="text-sm font-bold text-accent">{viewBooking.date}</p>
                </div>
                <div className="bg-light-gray rounded-lg p-3">
                  <div className="flex items-center gap-1 mb-1">
                    <Clock className="w-3 h-3 text-gold" />
                    <span className="text-[10px] font-bold text-dark-gray uppercase">Time</span>
                  </div>
                  <p className="text-sm font-bold text-accent">{viewBooking.startTime} – {viewBooking.endTime}</p>
                </div>
              </div>

              <div className="bg-light-gray rounded-lg p-3">
                <div className="flex items-center gap-1 mb-1">
                  <User className="w-3 h-3 text-gold" />
                  <span className="text-[10px] font-bold text-dark-gray uppercase">Booked By</span>
                </div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-bold text-accent">{viewBooking.user?.name || 'Unknown'}</p>
                  <span className="text-[10px] px-2 py-0.5 bg-accent text-white rounded-full font-bold capitalize">
                    {viewBooking.user?.role === 'classrep' ? 'Class Rep' : viewBooking.user?.role || 'N/A'}
                  </span>
                </div>
              </div>

              {viewBooking.notes && (
                <div className="bg-light-gray rounded-lg p-3">
                  <p className="text-[10px] font-bold text-dark-gray uppercase mb-1">Notes</p>
                  <p className="text-sm text-accent">{viewBooking.notes}</p>
                </div>
              )}

              {viewBooking.attendance !== null && (
                <div className="bg-green-50 rounded-lg p-3">
                  <p className="text-[10px] font-bold text-green-600 uppercase mb-1">Attendance Logged</p>
                  <p className="text-lg font-black text-green-700">{viewBooking.attendance} attendees</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Cancel Confirm */}
      <ConfirmDialog
        isOpen={cancelDialog.open}
        title="Cancel Booking"
        description={`Are you sure you want to cancel the booking for "${cancelDialog.name}"? This action cannot be undone.`}
        confirmLabel="Cancel Booking"
        onConfirm={handleCancel}
        onCancel={() => setCancelDialog({ open: false, id: '', name: '' })}
      />

      {/* Delete Confirm */}
      <ConfirmDialog
        isOpen={deleteDialog.open}
        title="Delete Booking"
        description={`Are you sure you want to permanently delete the booking for "${deleteDialog.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setDeleteDialog({ open: false, id: '', name: '' })}
      />
    </motion.div>
  )
}
