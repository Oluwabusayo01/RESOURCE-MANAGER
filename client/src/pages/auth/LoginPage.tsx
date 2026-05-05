import { useState } from 'react'
import { motion } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { authService } from '@/lib/apiService'
import { useAuthStore } from '@/store/useAuthStore'
import { toast } from 'sonner'
import { Eye, EyeOff, Loader2, Info } from 'lucide-react'

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
})

type LoginFormValues = z.infer<typeof loginSchema>

export default function LoginPage() {
  const navigate = useNavigate()
  const { setUser, setToken } = useAuthStore()
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  const onSubmit = async (data: LoginFormValues) => {
    setLoading(true)
    setError(null)
    try {
      const result = await authService.login(data.email, data.password)

      // Store in localStorage
      localStorage.setItem('rm_token', result.token)
      localStorage.setItem('rm_user', JSON.stringify(result.user))

      // Store in Zustand
      setToken(result.token)
      setUser(result.user)

      toast.success(`Welcome back, ${result.user.name}!`)

      // Redirect based on role + status (PROMPT.md section 7)
      if (result.user.status === 'pending' || result.user.status === 'rejected') {
        navigate('/status')
      } else {
        const dashboardMap: Record<string, string> = {
          admin: '/admin/dashboard',
          staff: '/staff/dashboard',
          classrep: '/classrep/dashboard',
        }
        navigate(dashboardMap[result.user.role] || '/')
      }
    } catch (err: any) {
      const message = err.message || err.response?.data?.message || 'Something went wrong.'
      if (message.toLowerCase().includes('invalid') || message.toLowerCase().includes('password')) {
        setError('Invalid email or password.')
      } else {
        setError(message)
        toast.error(message)
      }
    } finally {
      setLoading(false)
    }
  }

  const isMock = import.meta.env.VITE_USE_MOCK === 'true'

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="min-h-screen flex items-center justify-center bg-light-gray p-4"
    >
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg border border-mid-gray/20 p-8">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-1">
            <span className="text-3xl font-black text-accent">RM</span>
            <span className="text-sm font-bold text-gold ml-1 border-l border-mid-gray pl-2">
              FCI LAUTECH
            </span>
          </Link>
          <p className="text-dark-gray text-sm mt-2">Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Inline Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-lg font-medium">
              {error}
            </div>
          )}

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="you@fci.edu" {...register('email')} />
            {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
          </div>

          {/* Password */}
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                {...register('password')}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-gray hover:text-accent transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}
          </div>

          {/* Submit */}
          <Button
            type="submit"
            className="w-full bg-accent text-white hover:bg-accent/90 font-bold"
            disabled={loading}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Signing in...
              </span>
            ) : (
              'Sign In'
            )}
          </Button>
        </form>

        {/* Register Link */}
        <p className="text-center text-sm text-dark-gray mt-6">
          Don't have an account?{' '}
          <Link to="/register" className="text-gold font-bold hover:underline">
            Register
          </Link>
        </p>

        {/* Demo Credentials — only visible when VITE_USE_MOCK=true */}
        {isMock && (
          <div className="mt-6 p-4 bg-gold/5 border border-gold/20 rounded-lg">
            <div className="flex items-center gap-2 mb-3">
              <Info className="w-4 h-4 text-gold shrink-0" />
              <span className="text-xs font-bold text-gold uppercase tracking-wider">Demo Credentials</span>
            </div>
            <div className="space-y-2 text-xs text-dark-gray">
              <div className="flex items-center justify-between">
                <span className="font-bold text-accent">Admin</span>
                <span className="font-mono text-[11px]">admin@fci.lautech.edu.ng / admin1234</span>
              </div>
              <div className="border-t border-gold/10" />
              <div className="flex items-center justify-between">
                <span className="font-bold text-accent">Class Rep</span>
                <span className="font-mono text-[11px]">emeka@fci.edu / password123</span>
              </div>
              <div className="border-t border-gold/10" />
              <div className="flex items-center justify-between">
                <span className="font-bold text-accent">Staff</span>
                <span className="font-mono text-[11px]">aisha@fci.edu / password123</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  )
}
