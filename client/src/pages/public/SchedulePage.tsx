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
import ResourceImage from '@/components/shared/ResourceImage'
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

const format12Hour = (timeStr: string) => {
  if (!timeStr) return ''
  const [hourStr, minStr] = timeStr.split(':')
  const hour = parseInt(hourStr, 10)
  const ampm = hour >= 12 ? 'PM' : 'AM'
  const hour12 = hour % 12 === 0 ? 12 : hour % 12
  const hourPad = hour12.toString().padStart(2, '0')
  return `${hourPad}:${minStr} ${ampm}`
}

const calendarFormats = {
  timeGutterFormat: 'h:mm a',
  eventTimeRangeFormat: ({ start, end }: any, culture: any, localizer: any) =>
    `${localizer.format(start, 'h:mm a', culture)} - ${localizer.format(end, 'h:mm a', culture)}`,
  agendaTimeRangeFormat: ({ start, end }: any, culture: any, localizer: any) =>
    `${localizer.format(start, 'h:mm a', culture)} - ${localizer.format(end, 'h:mm a', culture)}`,
}

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
          bookingService.getPublic({ status: 'confirmed', limit: 1000 }),
          resourceService.getAll({ limit: 100 })
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
        title: `${b.resource?.name || 'Unknown Resource'}: ${b.course}`,
        start,
        end,
      }
    })
  }, [filteredBookings])

  const eventPropGetter = (event: any) => {
    let backgroundColor = '#3B82F6' // Default Blue
    if (event.department === 'cyber security') backgroundColor = '#8B5CF6' // Purple
    if (event.department === 'information system') backgroundColor = '#14B8A6' // Teal

    if (currentView === Views.AGENDA || currentView === 'agenda') {
      return {
        style: {
          borderLeft: `4px solid ${backgroundColor}`,
          backgroundColor: 'transparent',
          color: '#111111',
          fontSize: '0.875rem',
        }
      }
    }

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
        <h1 className="text-xl sm:text-4xl font-black text-accent mb-2">Resource Schedule</h1>
        <p className="text-dark-gray text-xs sm:text-base">View all confirmed bookings across FCI resources.</p>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 sm:p-6 rounded-xl border border-mid-gray/20 shadow-sm mb-8 flex flex-wrap items-end gap-3 sm:gap-4">
        <div className="space-y-2 w-full sm:flex-1 sm:min-w-[200px]">
          <label className="text-[10px] sm:text-xs font-bold uppercase text-dark-gray">Resource</label>
          <Select value={resourceFilter} onValueChange={setResourceFilter}>
            <SelectTrigger className="h-9 sm:h-10 text-sm">
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

        <div className="space-y-2 w-full sm:flex-1 sm:min-w-[200px]">
          <label className="text-[10px] sm:text-xs font-bold uppercase text-dark-gray">Department</label>
          <Select value={deptFilter} onValueChange={setDeptFilter}>
            <SelectTrigger className="h-9 sm:h-10 text-sm">
              <SelectValue placeholder="All Departments" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              <SelectItem value="computer science">Computer Science</SelectItem>
              <SelectItem value="cyber security">Cyber Security</SelectItem>
              <SelectItem value="information system">Information Systems (INS)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2 w-full sm:flex-1 sm:min-w-[150px]">
          <label className="text-[10px] sm:text-xs font-bold uppercase text-dark-gray">Date</label>
          <Input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="h-9 sm:h-10 text-sm"
          />
        </div>

        <Button variant="outline" onClick={resetFilters} className="gap-2 h-9 sm:h-10 w-full sm:w-auto font-bold text-dark-gray">
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
            formats={calendarFormats}
            eventPropGetter={eventPropGetter}
            onSelectEvent={(event) => setSelectedEvent(event as Booking)}
            min={new Date(1970, 1, 1, 7, 0, 0)}
            max={new Date(1970, 1, 1, 20, 0, 0)}
            style={{ height: '100%' }}
            className="fci-calendar"
          />
        )}
      </div>

      {/* Event Detail Dialog */}
      <Dialog open={!!selectedEvent} onOpenChange={(open) => !open && setSelectedEvent(null)}>
        <DialogContent className="sm:max-w-[425px] w-[95vw] max-h-[90vh] overflow-y-auto">
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
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  <ResourceImage src={selectedEvent.resource?.image} name={selectedEvent.resource?.name || 'Unknown Resource'} type={selectedEvent.resource?.type || 'lab'} className="w-14 h-14 rounded-lg object-cover border border-mid-gray/20 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <h3 className="text-xl font-bold text-accent truncate">{selectedEvent.resource?.name || 'Unknown Resource'}</h3>
                    <p className="text-dark-gray font-medium truncate">{selectedEvent.course}</p>
                  </div>
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
                  <p className="text-sm font-bold">{format12Hour(selectedEvent.startTime)} - {format12Hour(selectedEvent.endTime)}</p>
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
        .fci-calendar .rbc-agenda-view table.rbc-agenda-table {
          border: 1px solid #e5e7eb;
          border-collapse: collapse;
          border-radius: 8px;
          overflow: hidden;
          width: 100%;
        }
        .fci-calendar .rbc-agenda-view table.rbc-agenda-table tbody tr {
          border-bottom: 1px solid #e5e7eb;
          background-color: transparent !important;
        }
        .fci-calendar .rbc-agenda-view table.rbc-agenda-table tbody tr:hover {
          background-color: #f9fafb !important;
        }
        .fci-calendar .rbc-agenda-view table.rbc-agenda-table td {
          padding: 14px 18px;
          vertical-align: middle;
          font-size: 0.875rem;
          color: #374151;
          background-color: transparent !important;
        }
        .fci-calendar .rbc-agenda-view table.rbc-agenda-table th {
          padding: 14px 18px;
          background: #f9f9f9;
          font-weight: 800;
          text-transform: uppercase;
          font-size: 0.75rem;
          color: #111111;
          border-bottom: 2px solid #e5e7eb;
          text-align: left;
        }
        .fci-calendar .rbc-agenda-date-cell {
          font-weight: 800;
          color: #111111 !important;
          border-right: 1px solid #e5e7eb;
        }
        .fci-calendar .rbc-agenda-time-cell {
          font-weight: 700;
          color: #C9A84C !important;
          border-right: 1px solid #e5e7eb;
        }
        .fci-calendar .rbc-agenda-event-cell {
          font-weight: 600;
        }
      `}</style>
    </motion.div>
  )
}
