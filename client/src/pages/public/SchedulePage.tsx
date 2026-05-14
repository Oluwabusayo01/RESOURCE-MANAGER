import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Calendar, dateFnsLocalizer, Views } from 'react-big-calendar'
import { format, parse, startOfWeek, getDay } from 'date-fns'
import { enUS } from 'date-fns/locale'
import 'react-big-calendar/lib/css/react-big-calendar.css'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import StatusBadge from '@/components/shared/StatusBadge'
import { bookingService, resourceService } from '@/lib/apiService'
import type { Booking, Resource } from '@/types'
import { RotateCcw, Info } from 'lucide-react'

// Calendar localizer setup
const locales = {
  'en-US': enUS,
}

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
})

export default function SchedulePage() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [resources, setResources] = useState<Resource[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedEvent, setSelectedEvent] = useState<Booking | null>(null)

  // Filters
  const [resourceFilter, setResourceFilter] = useState<string>('all')
  const [deptFilter, setDeptFilter] = useState<string>('all')
  const [dateFilter, setDateFilter] = useState<string>('')
  
  // View state for mobile responsiveness
  const [currentView, setCurrentView] = useState<any>(Views.WEEK)
  const [currentDate, setCurrentDate] = useState(new Date())

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setCurrentView(Views.DAY)
      } else {
        setCurrentView(Views.WEEK)
      }
    }
    
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [bookingsData, resourcesData] = await Promise.all([
          bookingService.getAll({ status: 'confirmed' }),
          resourceService.getAll()
        ])
        setBookings(bookingsData)
        setResources(resourcesData)
      } catch (err) {
        console.error('Failed to fetch schedule data', err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  // Sync date filter with calendar date
  useEffect(() => {
    if (dateFilter) {
      try {
        const selectedDate = parse(dateFilter, 'yyyy-MM-dd', new Date())
        if (!isNaN(selectedDate.getTime())) {
          setCurrentDate(selectedDate)
        }
      } catch (e) {
        console.error('Invalid date format', e)
      }
    }
  }, [dateFilter])

  const filteredBookings = useMemo(() => {
    return bookings.filter(b => {
      const matchResource = resourceFilter === 'all' || b.resourceId === resourceFilter
      const matchDept = deptFilter === 'all' || b.department === deptFilter
      return matchResource && matchDept
    })
  }, [bookings, resourceFilter, deptFilter])

  const events = useMemo(() => {
    return filteredBookings.map(b => {
      // Parse date and times
      const start = new Date(`${b.date}T${b.startTime}`)
      const end = new Date(`${b.date}T${b.endTime}`)
      return {
        ...b,
        title: `${b.resource.name}: ${b.course}`,
        start,
        end,
      }
    })
  }, [filteredBookings])

  const eventPropGetter = (event: any) => {
    let backgroundColor = '#3B82F6' // Default Blue
    if (event.department === 'cyber security') backgroundColor = '#8B5CF6' // Purple
    if (event.department === 'information systems sciences (ins)') backgroundColor = '#14B8A6' // Teal

    return {
      style: {
        backgroundColor,
        borderRadius: '6px',
        opacity: 0.8,
        color: 'white',
        border: 'none',
        display: 'block',
        fontSize: '0.75rem',
        fontWeight: 'bold',
      }
    }
  }

  const resetFilters = () => {
    setResourceFilter('all')
    setDeptFilter('all')
    setDateFilter('')
    setCurrentDate(new Date())
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="container mx-auto px-4 py-10"
    >
      <div className="mb-10">
        <h1 className="text-4xl font-black text-accent mb-2">Resource Schedule</h1>
        <p className="text-dark-gray">View all confirmed bookings across FCI resources.</p>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-6 rounded-xl border border-mid-gray/20 shadow-sm mb-8 flex flex-wrap items-end gap-4">
        <div className="space-y-2 flex-1 min-w-[200px]">
          <label className="text-xs font-bold uppercase text-dark-gray">Resource</label>
          <Select value={resourceFilter} onValueChange={setResourceFilter}>
            <SelectTrigger>
              <SelectValue placeholder="All Resources" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Resources</SelectItem>
              {resources.map(r => (
                <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2 flex-1 min-w-[200px]">
          <label className="text-xs font-bold uppercase text-dark-gray">Department</label>
          <Select value={deptFilter} onValueChange={setDeptFilter}>
            <SelectTrigger>
              <SelectValue placeholder="All Departments" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              <SelectItem value="computer science">Computer Science</SelectItem>
              <SelectItem value="cyber security">Cyber Security</SelectItem>
              <SelectItem value="information systems sciences (ins)">Information Systems (INS)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2 flex-1 min-w-[200px]">
          <label className="text-xs font-bold uppercase text-dark-gray">Date</label>
          <Input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
          />
        </div>

        <Button variant="outline" onClick={resetFilters} className="gap-2">
          <RotateCcw className="w-4 h-4" />
          Reset
        </Button>
      </div>

      {/* Calendar View */}
      <div className="bg-white p-6 rounded-xl border border-mid-gray/20 shadow-sm h-[700px]">
        {loading ? (
          <div className="h-full w-full space-y-4">
            <div className="flex justify-between">
              <Skeleton className="h-10 w-48" />
              <div className="flex gap-2">
                <Skeleton className="h-10 w-24" />
                <Skeleton className="h-10 w-24" />
              </div>
            </div>
            <Skeleton className="h-[580px] w-full" />
          </div>
        ) : (
          <Calendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            view={currentView}
            onView={(v) => setCurrentView(v)}
            date={currentDate}
            onNavigate={(date) => {
              setCurrentDate(date)
              // Update date filter input to match if needed, or just leave it
              const dateString = format(date, 'yyyy-MM-dd')
              setDateFilter(dateString)
            }}
            views={[Views.WEEK, Views.DAY, Views.AGENDA]}
            eventPropGetter={eventPropGetter}
            onSelectEvent={(event) => setSelectedEvent(event as Booking)}
            style={{ height: '100%' }}
            className="fci-calendar"
          />
        )}
      </div>

      {/* Event Detail Dialog */}
      <Dialog open={!!selectedEvent} onOpenChange={(open) => !open && setSelectedEvent(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Info className="w-5 h-5 text-gold" />
              Booking Details
            </DialogTitle>
            <DialogDescription>
              Detailed information about this reserved slot.
            </DialogDescription>
          </DialogHeader>

          {selectedEvent && (
            <div className="py-6 space-y-6">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-xl font-bold text-accent">{selectedEvent.resource.name}</h3>
                  <p className="text-dark-gray font-medium">{selectedEvent.course}</p>
                </div>
                <StatusBadge status={selectedEvent.status} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-light-gray rounded-lg">
                  <p className="text-[10px] font-bold text-dark-gray uppercase mb-1">Date</p>
                  <p className="text-sm font-bold">{selectedEvent.date}</p>
                </div>
                <div className="p-3 bg-light-gray rounded-lg">
                  <p className="text-[10px] font-bold text-dark-gray uppercase mb-1">Time Range</p>
                  <p className="text-sm font-bold">{selectedEvent.startTime} - {selectedEvent.endTime}</p>
                </div>
              </div>

              <div className="p-3 bg-light-gray rounded-lg">
                <p className="text-[10px] font-bold text-dark-gray uppercase mb-1">Booked By</p>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-bold">{selectedEvent.user?.name || 'Unknown'}</p>
                  <span className="text-[10px] px-2 py-0.5 bg-accent text-white rounded-full font-bold">
                    Class Rep
                  </span>
                </div>
                <p className="text-xs text-dark-gray mt-1">{selectedEvent.department}</p>
              </div>

              {selectedEvent.notes && (
                <div className="p-3 bg-gold/5 border border-gold/10 rounded-lg">
                  <p className="text-[10px] font-bold text-gold uppercase mb-1">Notes</p>
                  <p className="text-sm text-accent italic">"{selectedEvent.notes}"</p>
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end">
            <Button onClick={() => setSelectedEvent(null)} className="bg-accent text-white">
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Global Calendar Styles */}
      <style>{`
        .fci-calendar .rbc-header {
          padding: 12px;
          font-weight: 800;
          text-transform: uppercase;
          font-size: 0.75rem;
          background: #f9f9f9;
        }
        .fci-calendar .rbc-today {
          background-color: #C9A84C10;
        }
        .fci-calendar .rbc-event {
          box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
        }
        .fci-calendar .rbc-toolbar button {
          border-radius: 6px;
          font-weight: 700;
          font-size: 0.875rem;
          color: #111111;
        }
        .fci-calendar .rbc-toolbar button:hover {
          background-color: #f5f5f5;
        }
        .fci-calendar .rbc-toolbar button.rbc-active {
          background-color: #111111;
          color: white;
        }
      `}</style>
    </motion.div>
  )
}
