import { motion } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/useAuthStore'
import { Clock, XCircle, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function StatusPage() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const status = user?.status || 'pending'

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="min-h-screen flex items-center justify-center bg-light-gray p-4"
    >
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg border border-mid-gray/20 p-8 text-center">
        {/* Logo */}
        <div className="mb-8">
          <Link to="/" className="inline-flex items-center gap-1">
            <span className="text-3xl font-black text-accent">RM</span>
            <span className="text-sm font-bold text-gold ml-1 border-l border-mid-gray pl-2">
              FCI LAUTECH
            </span>
          </Link>
        </div>

        {status === 'pending' && (
          <>
            {/* Pulsing gold clock icon */}
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gold/10 border-2 border-gold/30 mb-6">
              <motion.div
                animate={{ scale: [1, 1.15, 1] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              >
                <Clock className="w-10 h-10 text-gold" />
              </motion.div>
            </div>

            <h1 className="text-2xl font-black text-accent mb-3">
              Account Pending Approval
            </h1>
            <p className="text-dark-gray text-sm leading-relaxed">
              Your registration has been submitted. The admin will review your
              account. You will be notified once it is approved.
            </p>
          </>
        )}

        {status === 'rejected' && (
          <>
            {/* Red X icon */}
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-50 border-2 border-red-200 mb-6">
              <XCircle className="w-10 h-10 text-red-500" />
            </div>

            <h1 className="text-2xl font-black text-accent mb-3">
              Registration Not Approved
            </h1>
            <p className="text-dark-gray text-sm leading-relaxed">
              Your account was not approved. Please contact the Faculty admin
              for more information.
            </p>
          </>
        )}

        {/* User Info */}
        {user && (
          <div className="bg-light-gray rounded-lg p-4 mt-6 text-left space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-dark-gray">Name</span>
              <span className="font-bold text-accent">{user.name}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-dark-gray">Email</span>
              <span className="font-bold text-accent">{user.email}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-dark-gray">Role</span>
              <span className="font-bold text-accent capitalize">{user.role}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-dark-gray">Department</span>
              <span className="font-bold text-accent">{user.department}</span>
            </div>
          </div>
        )}

        {/* Logout Button */}
        <Button
          variant="outline"
          onClick={handleLogout}
          className="w-full mt-8 gap-2 font-bold border-accent text-accent hover:bg-light-gray"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </Button>
      </div>
    </motion.div>
  )
}
