import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/store/useAuthStore'
import { cn } from '@/lib/utils'
import { Menu, X } from 'lucide-react'

export default function Navbar() {
  const location = useLocation()
  const { user } = useAuthStore()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Schedule', path: '/schedule' },
    { name: 'E-Library', path: '/library' },
  ]

  const authLinks = user
    ? [{ name: 'Dashboard', path: user.role === 'admin' ? '/admin/dashboard' : user.role === 'staff' ? '/staff/dashboard' : '/classrep/dashboard' }]
    : [
        { name: 'Login', path: '/login' },
        { name: 'Register', path: '/register' },
      ]

  const allLinks = [...navLinks, ...authLinks]

  const isActive = (path: string) => location.pathname === path

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur-md">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-1">
            <span className="text-2xl font-extrabold text-black">RM</span>
            <span className="text-sm font-medium text-gold ml-1 border-l border-mid-gray pl-2">
              FCI LAUTECH
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            {allLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={cn(
                  "text-sm font-semibold transition-colors hover:text-gold relative py-1",
                  isActive(link.path) ? "text-gold" : "text-dark-gray"
                )}
              >
                {link.name}
                {isActive(link.path) && (
                  <span className="absolute bottom-0 left-0 w-full h-0.5 bg-gold rounded-full" />
                )}
              </Link>
            ))}
          </div>

          {/* Mobile Toggle */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 text-accent"
            >
              {isMobileMenuOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t bg-white p-4 space-y-4 shadow-xl">
          {allLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              onClick={() => setIsMobileMenuOpen(false)}
              className={cn(
                "block text-lg font-bold p-2 rounded-lg",
                isActive(link.path) ? "bg-gold/10 text-gold" : "text-dark-gray"
              )}
            >
              {link.name}
            </Link>
          ))}
        </div>
      )}
    </nav>
  )
}
