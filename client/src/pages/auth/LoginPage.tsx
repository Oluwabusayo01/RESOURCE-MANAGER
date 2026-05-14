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
import { Eye, EyeOff, Loader2 } from 'lucide-react'

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
      const message = err.response?.data?.message || err.message || 'Something went wrong.'
      setError(message)
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  const isMock = import.meta.env.VITE_USE_MOCK === 'true'

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAFAFA] relative overflow-hidden p-4">
      {/* Decorative background elements */}
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-gold/5 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-accent/5 rounded-full blur-[120px]" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="w-full max-w-md z-10"
      >
        <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-mid-gray/20 overflow-hidden">
          {/* Header/Logo Section */}
          <div className="bg-accent p-8 text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gold/10 rounded-full translate-x-16 -translate-y-16" />
            <Link to="/" className="inline-flex items-center gap-2 relative z-10">
              <span className="text-4xl font-black text-white tracking-tighter">RM</span>
              <div className="h-8 w-px bg-white/20 mx-1" />
              <div className="text-left">
                <span className="block text-[10px] font-bold text-gold uppercase tracking-[0.2em] leading-none mb-1">
                  Faculty of Computing
                </span>
                <span className="block text-xs font-medium text-white/80 leading-none">
                  LAUTECH
                </span>
              </div>
            </Link>
          </div>

          <div className="p-8">
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-accent tracking-tight">Welcome back</h1>
              <p className="text-dark-gray text-sm mt-1">Please enter your details to sign in.</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Inline Error */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="bg-red-50 border border-red-100 text-red-600 text-sm px-4 py-3 rounded-xl font-medium flex items-center gap-2"
                >
                  <div className="w-1.5 h-1.5 bg-red-600 rounded-full animate-pulse" />
                  {error}
                </motion.div>
              )}

              <div className="space-y-4">
                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-xs font-bold uppercase tracking-wider text-dark-gray/70">
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@fci.lautech.edu.ng"
                    className="h-12 bg-light-gray/50 border-mid-gray/30 focus:border-gold focus:ring-gold/20 rounded-xl transition-all"
                    {...register('email')}
                  />
                  {errors.email && <p className="text-xs text-red-500 font-medium">{errors.email.message}</p>}
                </div>

                {/* Password */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-xs font-bold uppercase tracking-wider text-dark-gray/70">
                      Password
                    </Label>
                    <Link to="#" className="text-[11px] font-bold text-gold hover:text-gold/80 transition-colors">
                      Forgot Password?
                    </Link>
                  </div>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      className="h-12 bg-light-gray/50 border-mid-gray/30 focus:border-gold focus:ring-gold/20 rounded-xl pr-12 transition-all"
                      {...register('password')}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-dark-gray hover:text-accent transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {errors.password && <p className="text-xs text-red-500 font-medium">{errors.password.message}</p>}
                </div>
              </div>

              {/* Submit */}
              <Button
                type="submit"
                className="w-full h-12 bg-accent text-white hover:bg-accent/90 rounded-xl font-bold text-base shadow-lg shadow-accent/10 transition-all active:scale-[0.98]"
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Authenticating...
                  </span>
                ) : (
                  'Sign In'
                )}
              </Button>
            </form>

            <div className="mt-8 pt-6 border-t border-mid-gray/20 text-center">
              <p className="text-sm text-dark-gray">
                New member?{' '}
                <Link to="/register" className="text-gold font-bold hover:text-gold/80 transition-colors">
                  Create an account
                </Link>
              </p>
            </div>

            {/* Demo Credentials — only visible when VITE_USE_MOCK=true */}
            {isMock && (
              <div className="mt-8 p-5 bg-[#F9F9F9] border border-mid-gray/20 rounded-2xl">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-2 h-2 bg-gold rounded-full" />
                  <span className="text-[10px] font-black text-accent uppercase tracking-widest">Demo Access</span>
                </div>
                <div className="space-y-3">
                  {[
                    { role: 'Admin', email: 'admin@fci.lautech.edu.ng', pass: 'admin1234' },
                    { role: 'Class Rep', email: 'emeka@fci.edu', pass: 'password123' },
                    { role: 'Staff', email: 'aisha@fci.edu', pass: 'password123' }
                  ].map((cred, i) => (
                    <div key={i} className="flex flex-col gap-1">
                      <span className="text-[10px] font-bold text-dark-gray">{cred.role}</span>
                      <div className="flex items-center justify-between bg-white px-3 py-2 rounded-lg border border-mid-gray/10 shadow-sm">
                        <span className="text-[11px] font-mono text-accent">{cred.email}</span>
                        <span className="text-[11px] font-mono text-gold">{cred.pass}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer info */}
        <p className="text-center text-[11px] text-dark-gray/60 mt-8 font-medium">
          &copy; 2026 Faculty of Computing and Informatics, LAUTECH. All rights reserved.
        </p>
      </motion.div>
    </div>
  )
}

