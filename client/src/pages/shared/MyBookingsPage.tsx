import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/useAuthStore'
import { bookingService } from '@/lib/apiService'
import type { Booking } from '@/types'
import StatusBadge from '@/components/shared/StatusBadge'
import ConfirmDialog from '@/components/shared/ConfirmDialog'
import ResourceImage from '@/components/shared/ResourceImage'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { CalendarCheck, Eye, XCircle, Search, ChevronLeft, ChevronRight } from 'lucide-react'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'

const PER_PAGE = 10

const format12Hour = (timeStr: string) => {
  if (!timeStr) return ''
  const [hourStr, minStr] = timeStr.split(':')
  const hour = parseInt(hourStr, 10)
  const ampm = hour >= 12 ? 'PM' : 'AM'
  const hour12 = hour % 12 === 0 ? 12 : hour % 12
  const hourPad = hour12.toString().padStart(2, '0')
  return `${hourPad}:${minStr} ${ampm}`
}

export default function MyBookingsPage() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [page, setPage] = useState(1)
  const [cancelDialog, setCancelDialog] = useState<{ open: boolean; id: string }>({ open: false, id: '' })

  const fetchData = async () => {
    setLoading(true)
    try {
      const data = await bookingService.getAll({ userId: user?.id })
      setBookings(data)
    } catch (err) {
      console.error('Failed to load bookings', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [user?.id])

  useEffect(() => {
    setPage(1)
  }, [searchQuery])

  const handleCancel = async () => {
    try {
      await bookingService.cancel(cancelDialog.id)
      toast.success('Booking cancelled.')
      setCancelDialog({ open: false, id: '' })
      fetchData()
    } catch (err: any) {
      toast.error(err.message || 'Failed to cancel booking.')
    }
  }

  const filteredBookings = bookings.filter(b => 
    b.resource.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.course.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Pagination
  const totalPages = Math.ceil(filteredBookings.length / PER_PAGE)
  const paginatedBookings = filteredBookings.slice((page - 1) * PER_PAGE, page * PER_PAGE)

  const today = new Date().toISOString().split('T')[0]
  const basePath = user?.role === 'staff' ? '/staff' : '/classrep'

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-accent">My Bookings</h1>
          <p className="text-dark-gray text-sm mt-1">Manage and track all your resource reservations.</p>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-mid-gray" />
          <Input
            placeholder="Search by resource or course..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-mid-gray/20 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-5 space-y-4">
            {[1, 2, 3, 4, 5].map(i => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className="p-20 text-center">
            <CalendarCheck className="w-16 h-16 text-mid-gray/30 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-accent">No bookings found</h3>
            <p className="text-dark-gray mt-2">
              {searchQuery ? "No results match your search." : "You haven't made any bookings yet."}
            </p>
            {!searchQuery && (
              <Button 
                onClick={() => navigate(`${basePath}/book`)}
                className="mt-6 bg-accent text-white"
              >
                Book a Resource Now
              </Button>
            )}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-light-gray/50 hover:bg-light-gray/50">
                    <TableHead className="font-bold">Resource</TableHead>
                    <TableHead className="font-bold">Course</TableHead>
                    <TableHead className="font-bold">Date</TableHead>
                    <TableHead className="font-bold">Time</TableHead>
                    <TableHead className="font-bold">Status</TableHead>
                    <TableHead className="font-bold text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedBookings.map((b) => (
                    <TableRow key={b.id} className="hover:bg-light-gray/30">
                      <TableCell className="font-bold text-accent">
                        <div className="flex items-center gap-3">
                          <ResourceImage src={b.resource.image} name={b.resource.name} type={b.resource.type} />
                          <span>{b.resource.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-dark-gray font-medium">{b.course}</TableCell>
                      <TableCell className="font-medium">{b.date}</TableCell>
                      <TableCell className="text-sm font-medium">{format12Hour(b.startTime)} – {format12Hour(b.endTime)}</TableCell>
                      <TableCell><StatusBadge status={b.status} /></TableCell>
                      <TableCell className="text-right space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`${basePath}/bookings/${b.id}`)}
                          className="text-accent hover:bg-accent/5"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        {b.status === 'confirmed' && b.date >= today && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setCancelDialog({ open: true, id: b.id })}
                            className="text-red-500 hover:text-red-600 hover:bg-red-50"
                          >
                            <XCircle className="w-4 h-4" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between p-4 border-t bg-light-gray/30">
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
          </>
        )}
      </div>

      <ConfirmDialog
        isOpen={cancelDialog.open}
        title="Cancel Booking"
        description="Are you sure you want to cancel this booking? This action cannot be undone."
        confirmLabel="Cancel Booking"
        onConfirm={handleCancel}
        onCancel={() => setCancelDialog({ open: false, id: '' })}
      />
    </motion.div>
  )
}
