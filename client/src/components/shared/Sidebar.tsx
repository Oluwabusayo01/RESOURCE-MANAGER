import { Link, useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuthStore } from '@/store/useAuthStore'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  CalendarPlus,
  History,
  Bell,
  Upload,
  Users,
  Settings,
  LogOut,
  Menu,
  X
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useState } from 'react'
import StatusBadge from './StatusBadge'

export default function Sidebar() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()
  // const [isOpen, setIsOpen] = useState(true)
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const roleLinks: Record<string, any[]> = {
    classrep: [
      { name: 'Dashboard', path: '/classrep/dashboard', icon: LayoutDashboard },
      { name: 'Book a Resource', path: '/classrep/book', icon: CalendarPlus },
      { name: 'My Bookings', path: '/classrep/bookings', icon: History },
      { name: 'Notifications', path: '/classrep/notifications', icon: Bell },
    ],
    staff: [
      { name: 'Dashboard', path: '/staff/dashboard', icon: LayoutDashboard },
      { name: 'Book a Resource', path: '/staff/book', icon: CalendarPlus },
      { name: 'My Bookings', path: '/staff/bookings', icon: History },
      { name: 'Upload Material', path: '/staff/upload', icon: Upload },
      { name: 'Notifications', path: '/staff/notifications', icon: Bell },
    ],
    admin: [
      { name: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
      { name: 'Manage Users', path: '/admin/users', icon: Users },
      { name: 'Manage Resources', path: '/admin/resources', icon: Settings },
      { name: 'All Bookings', path: '/admin/bookings', icon: History },
    ],
  }

  const links = user ? roleLinks[user.role] || [] : []

  const sidebarContent = (
    <div className="flex flex-col h-full bg-accent text-white p-6 shadow-2xl">
      {/* Top Section */}
      <div className="mb-10">
        <h1 className="text-2xl font-black tracking-tighter">RM</h1>
        <p className="text-xs font-bold text-gold tracking-widest uppercase">FCI LAUTECH</p>
      </div>

      {/* Nav Links */}
      <nav className="flex-1 space-y-2">
        {links.map((link) => {
          const Icon = link.icon
          const active = location.pathname === link.path
          return (
            <Link
              key={link.name}
              to={link.path}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group",
                active
                  ? "bg-white/10 text-gold border-l-4 border-gold"
                  : "text-mid-gray hover:text-white hover:bg-white/5 border-l-4 border-transparent"
              )}
            >
              <Icon className={cn("w-5 h-5", active ? "text-gold" : "text-mid-gray group-hover:text-white")} />
              <span className="font-semibold text-sm">{link.name}</span>
            </Link>
          )
        })}
      </nav>

      {/* Bottom Section */}
      <div className="mt-auto pt-6 border-t border-white/10 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gold/20 flex items-center justify-center text-gold font-bold">
            {user?.name.charAt(0)}
          </div>
          <div className="overflow-hidden">
            <p className="text-sm font-bold truncate">{user?.name}</p>
            <StatusBadge status="active" className="text-[10px] py-0 h-4 bg-gold/20 text-gold border-none" />
          </div>
        </div>
        <Button
          variant="ghost"
          onClick={handleLogout}
          className="w-full justify-start gap-3 text-red-400 hover:text-red-500 hover:bg-red-500/10 p-0 h-auto font-bold"
        >
          <LogOut className="w-5 h-5" />
          Logout
        </Button>
      </div>
    </div>
  )

  return (
    <>
      {/* Mobile Toggle */}
      <div className="lg:hidden fixed top-4 left-4 z-[60]">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="bg-white text-accent border-accent"
        >
          {isMobileOpen ? <X /> : <Menu />}
        </Button>
      </div>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 h-screen sticky top-0">
        {sidebarContent}
      </aside>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isMobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 lg:hidden"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 w-72 z-55 lg:hidden"
            >
              {sidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
