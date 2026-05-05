import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { 
  CalendarCheck, 
  CheckCircle, 
  Shield, 
  Monitor, 
  Lock, 
  Globe, 
  ArrowRight,
  BookOpen
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import StatusBadge from '@/components/shared/StatusBadge'
import { bookingService } from '@/lib/apiService'
import type { Booking } from '@/types'

export default function HomePage() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchTodayBookings = async () => {
      try {
        // Mock delay is handled inside apiService
        const data = await bookingService.getAll({ 
          date: new Date().toISOString().split('T')[0], 
          status: 'confirmed', 
          limit: 4 
        })
        setBookings(data)
      } catch (err) {
        console.error('Failed to fetch today bookings', err)
      } finally {
        setLoading(false)
      }
    }

    fetchTodayBookings()
  }, [])

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col w-full"
    >
      {/* 1. Hero Section */}
      <section className="relative overflow-hidden bg-white py-20 lg:py-32 border-b">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#f0f0f0_1px,transparent_1px),linear-gradient(to_bottom,#f0f0f0_1px,transparent_1px)] bg-size-[4rem_4rem] mask-image-[radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
        <div className="container relative mx-auto px-4 text-center">
          <motion.h1 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-5xl lg:text-7xl font-black text-accent tracking-tight mb-6"
          >
            Book Smarter. <span className="text-gold">Learn Better.</span>
          </motion.h1>
          <motion.p 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-lg lg:text-xl text-dark-gray max-w-2xl mx-auto mb-10 font-medium"
          >
            The official resource booking system for the Faculty of
            Computing and Informatics, LAUTECH.
          </motion.p>
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Button asChild size="lg" className="bg-accent text-white hover:bg-accent/90 px-8 font-bold">
              <Link to="/schedule">View Schedule</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-accent text-accent hover:bg-light-gray px-8 font-bold">
              <Link to="/login">Login</Link>
            </Button>
          </motion.div>
        </div>
      </section>

      {/* 2. Feature Cards */}
      <section className="py-20 bg-light-gray/30">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { 
                title: "Real-Time Availability", 
                desc: "instantly check if a lab or hall is free for your next class or session.",
                icon: CalendarCheck 
              },
              { 
                title: "Instant Confirmation", 
                desc: "No more waiting. Book and get confirmed immediately by the system.",
                icon: CheckCircle 
              },
              { 
                title: "Role-Based Access", 
                desc: "Secure permissions for students, staff, and admin to manage resources.",
                icon: Shield 
              },
            ].map((f, i) => (
              <motion.div 
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-white p-8 rounded-2xl shadow-sm border border-mid-gray/20"
              >
                <div className="w-12 h-12 bg-gold/10 rounded-xl flex items-center justify-center mb-6">
                  <f.icon className="w-6 h-6 text-gold" />
                </div>
                <h3 className="text-xl font-bold text-accent mb-3">{f.title}</h3>
                <p className="text-dark-gray text-sm leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. Departments Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-black text-accent text-center mb-12">Serving All FCI Departments</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              { name: "Computer Science", icon: Monitor },
              { name: "Cyber Security", icon: Lock },
              { name: "Information Systems", icon: Globe },
            ].map((d) => (
              <div key={d.name} className="flex items-center gap-4 p-6 border rounded-xl hover:border-gold transition-colors group">
                <div className="p-3 bg-light-gray rounded-lg group-hover:bg-gold/10 transition-colors">
                  <d.icon className="w-6 h-6 text-accent group-hover:text-gold" />
                </div>
                <span className="font-bold text-accent">{d.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. Today's Bookings Snapshot */}
      <section className="py-20 bg-light-gray/20">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-10">
            <h2 className="text-3xl font-black text-accent">Today's Bookings</h2>
            <Link to="/schedule" className="text-gold font-bold flex items-center gap-2 hover:underline">
              View Full Schedule <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {loading ? (
              [1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-white p-6 rounded-xl border border-mid-gray/20 space-y-4">
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <div className="flex justify-between items-center pt-4">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-6 w-16 rounded-full" />
                  </div>
                </div>
              ))
            ) : bookings.length > 0 ? (
              bookings.map((b) => (
                <div key={b.id} className="bg-white p-6 rounded-xl border border-mid-gray/20 shadow-sm hover:shadow-md transition-shadow">
                  <h4 className="font-bold text-accent truncate mb-1">{b.resource.name}</h4>
                  <p className="text-sm text-dark-gray mb-4 truncate">{b.course}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gold">{b.startTime} - {b.endTime}</span>
                    <StatusBadge status={b.status} className="text-[10px] py-0 px-2" />
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full py-12 text-center bg-white rounded-2xl border border-dashed border-mid-gray">
                <p className="text-dark-gray font-medium">No bookings scheduled for today.</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 5. E-Library Teaser */}
      <section className="py-20 bg-accent overflow-hidden relative">
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl">
            <h2 className="text-4xl lg:text-5xl font-black text-white mb-6 leading-tight">
              Access <span className="text-gold">Study Materials</span>
            </h2>
            <p className="text-lg text-mid-gray mb-10 leading-relaxed">
              Lecturers upload notes, slides, and past questions — all free to download. 
              Build your knowledge with the best resources from FCI.
            </p>
            <Button asChild size="lg" className="bg-gold text-accent hover:bg-gold/90 font-black px-10">
              <Link to="/library" className="flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                Browse E-Library
              </Link>
            </Button>
          </div>
        </div>
        {/* Background elements */}
        <div className="absolute top-0 right-0 w-1/3 h-full bg-gold/5 -skew-x-12" />
      </section>

    </motion.div>
  )
}
