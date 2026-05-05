import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { useAuthStore } from '@/store/useAuthStore'
import { Clock, XCircle, CheckCircle2, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useNavigate } from 'react-router-dom'

export default function StatusPage() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const status = user?.status || 'pending'

  const statusConfig = {
    pending: {
      icon: Clock,
      iconColor: 'text-yellow-500',
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
      title: 'Account Pending Approval',
      message: 'Your registration is being reviewed by a faculty administrator. You will be notified once your account has been approved.',
      hint: 'This usually takes 24–48 hours.',
    },
    rejected: {
      icon: XCircle,
      iconColor: 'text-red-500',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      title: 'Account Rejected',
      message: 'Unfortunately, your registration request was not approved. If you believe this is an error, please contact the faculty admin office.',
      hint: 'You may try registering again with a different email.',
    },
    approved: {
      icon: CheckCircle2,
      iconColor: 'text-green-500',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      title: 'Account Approved!',
      message: 'Your account has been approved. You can now access your dashboard.',
      hint: '',
    },
  }

  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending
  const Icon = config.icon

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

        {/* Status Icon */}
        <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full ${config.bgColor} ${config.borderColor} border-2 mb-6`}>
          <Icon className={`w-10 h-10 ${config.iconColor}`} />
        </div>

        <h1 className="text-2xl font-black text-accent mb-3">{config.title}</h1>
        <p className="text-dark-gray text-sm leading-relaxed mb-2">{config.message}</p>
        {config.hint && (
          <p className="text-xs text-mid-gray italic mb-6">{config.hint}</p>
        )}

        {/* User Info */}
        {user && (
          <div className="bg-light-gray rounded-lg p-4 mb-6 text-left space-y-2">
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

        {/* Actions */}
        <div className="flex flex-col gap-3">
          {status === 'approved' && (
            <Button
              asChild
              className="w-full bg-accent text-white hover:bg-accent/90 font-bold"
            >
              <Link to={
                user?.role === 'admin' ? '/admin/dashboard' :
                user?.role === 'staff' ? '/staff/dashboard' :
                '/classrep/dashboard'
              }>
                Go to Dashboard
              </Link>
            </Button>
          )}
          <Button
            variant="outline"
            onClick={handleLogout}
            className="w-full gap-2 font-bold text-dark-gray"
          >
            <LogOut className="w-4 h-4" />
            {status === 'rejected' ? 'Back to Home' : 'Logout'}
          </Button>
        </div>
      </div>
    </motion.div>
  )
}
