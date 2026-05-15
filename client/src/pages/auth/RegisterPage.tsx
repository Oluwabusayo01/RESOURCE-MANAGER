import { useState } from 'react'
import { motion } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { authService } from '@/lib/apiService'
import { toast } from 'sonner'
import { Eye, EyeOff, CheckCircle2, Users, GraduationCap, Loader2 } from 'lucide-react'
import type { UserRole, Department } from '@/types'
import { cn } from '@/lib/utils'

const registerSchema = z.object({
  name: z.string().min(3, 'Full name must be at least 3 characters'),
  email: z.string()
    .email('Please enter a valid email address')
    .refine((email) => email.toLowerCase().endsWith('lautech.edu.ng'), {
      message: 'Must be a valid LAUTECH email address (e.g. @student.lautech.edu.ng)',
    }),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
  department: z.string().min(1, 'Please select a department'),
  role: z.string().min(1, 'Please select a role'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})

interface RegisterFormValues {
  name: string
  email: string
  password: string
  confirmPassword: string
  department: string
  role: string
}

export default function RegisterPage() {
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema) as any,
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      department: '',
      role: '',
    },
  })


  const selectedRole = watch('role')

  const onSubmit = async (data: RegisterFormValues) => {
    setLoading(true)
    setError(null)
    try {
      await authService.register({
        name: data.name,
        email: data.email,
        password: data.password,
        department: data.department as Department,
        role: data.role as UserRole,
      })
      toast.success('Registration successful! Awaiting admin approval.')
      navigate('/status')
    } catch (err: any) {
      const message = err.response?.data?.message || err.message || 'Something went wrong.'
      setError(message)
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAFAFA] relative overflow-hidden p-4 py-12">
      {/* Decorative background elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-gold/5 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent/5 rounded-full blur-[120px]" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="w-full max-w-lg z-10"
      >
        <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-mid-gray/20 overflow-hidden">
          {/* Header/Logo Section */}
          <div className="bg-accent p-8 text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-32 h-32 bg-gold/10 rounded-full -translate-x-16 -translate-y-16" />
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
            <div className="mb-8 text-center">
              <h1 className="text-2xl font-bold text-accent tracking-tight">Create Account</h1>
              <p className="text-dark-gray text-sm mt-1">Join the FCI resource management system.</p>
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Full Name */}
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="name" className="text-xs font-bold uppercase tracking-wider text-dark-gray/70">Full Name</Label>
                  <Input
                    id="name"
                    placeholder="e.g. Chukwuemeka Obi"
                    className="h-12 bg-light-gray/50 border-mid-gray/30 focus:border-gold focus:ring-gold/20 rounded-xl transition-all"
                    {...register('name')}
                  />
                  {errors.name && <p className="text-xs text-red-500 font-medium">{errors.name.message}</p>}
                </div>

                {/* Email */}
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="email" className="text-xs font-bold uppercase tracking-wider text-dark-gray/70">Institutional Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@student.lautech.edu.ng"
                    className="h-12 bg-light-gray/50 border-mid-gray/30 focus:border-gold focus:ring-gold/20 rounded-xl transition-all"
                    {...register('email')}
                  />
                  <p className="text-[10px] text-dark-gray/60 font-medium flex items-center gap-1.5 px-1">
                    <div className="w-1 h-1 bg-gold rounded-full" />
                    Must be a valid LAUTECH email address.
                  </p>
                  {errors.email && <p className="text-xs text-red-500 font-medium">{errors.email.message}</p>}
                </div>

                {/* Password */}
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-xs font-bold uppercase tracking-wider text-dark-gray/70">Password</Label>
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

                {/* Confirm Password */}
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-xs font-bold uppercase tracking-wider text-dark-gray/70">Confirm</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirm ? 'text' : 'password'}
                      placeholder="••••••••"
                      className="h-12 bg-light-gray/50 border-mid-gray/30 focus:border-gold focus:ring-gold/20 rounded-xl pr-12 transition-all"
                      {...register('confirmPassword')}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-dark-gray hover:text-accent transition-colors"
                    >
                      {showConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {errors.confirmPassword && <p className="text-xs text-red-500 font-medium">{errors.confirmPassword.message}</p>}
                </div>

                {/* Department */}
                <div className="space-y-2 md:col-span-2">
                  <Label className="text-xs font-bold uppercase tracking-wider text-dark-gray/70">Department</Label>
                  <Select onValueChange={(val) => setValue('department', val, { shouldValidate: true })}>
                    <SelectTrigger className="h-12 bg-light-gray/50 border-mid-gray/30 focus:border-gold focus:ring-gold/20 rounded-xl">
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="computer science">Computer Science</SelectItem>
                      <SelectItem value="cyber security">Cyber Security</SelectItem>
                      <SelectItem value="information system">Information Systems (INS)</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.department && <p className="text-xs text-red-500 font-medium">{errors.department.message}</p>}
                </div>

                {/* Role */}
                <div className="space-y-3 md:col-span-2 pt-2">
                  <Label className="text-xs font-bold uppercase tracking-wider text-dark-gray/70">Select Your Role</Label>
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { id: 'classrep', label: 'Class Rep', icon: Users, desc: 'Manage bookings' },
                      { id: 'staff', label: 'Staff Member', icon: GraduationCap, desc: 'Upload materials' }
                    ].map((r) => (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => setValue('role', r.id, { shouldValidate: true })}
                        className={cn(
                          "relative flex flex-col items-center gap-2 p-5 rounded-2xl border-2 transition-all duration-300 group",
                          selectedRole === r.id
                            ? "border-gold bg-gold/3 shadow-md shadow-gold/5"
                            : "border-mid-gray/20 hover:border-mid-gray/40 bg-transparent hover:bg-light-gray/30"
                        )}
                      >
                        {selectedRole === r.id && (
                          <motion.div
                            layoutId="activeRole"
                            className="absolute top-3 right-3"
                          >
                            <CheckCircle2 className="w-5 h-5 text-gold" />
                          </motion.div>
                        )}
                        <r.icon className={cn(
                          "w-8 h-8 mb-1 transition-transform duration-300 group-hover:scale-110",
                          selectedRole === r.id ? "text-gold" : "text-dark-gray/40"
                        )} />
                        <div className="text-center">
                          <span className={cn(
                            "block text-sm font-black transition-colors",
                            selectedRole === r.id ? "text-accent" : "text-dark-gray"
                          )}>
                            {r.label}
                          </span>
                          <span className="text-[10px] text-dark-gray/50 font-medium">{r.desc}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                  {errors.role && <p className="text-xs text-red-500 font-medium text-center">{errors.role.message}</p>}
                </div>
              </div>

              {/* Submit */}
              <Button
                type="submit"
                className="w-full h-12 mt-4 bg-accent text-white hover:bg-accent/90 rounded-xl font-bold text-base shadow-lg shadow-accent/10 transition-all active:scale-[0.98]"
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Creating Account...
                  </span>
                ) : (
                  'Create Account'
                )}
              </Button>
            </form>

            <div className="mt-8 pt-6 border-t border-mid-gray/20 text-center">
              <p className="text-sm text-dark-gray">
                Already registered?{' '}
                <Link to="/login" className="text-gold font-bold hover:text-gold/80 transition-colors">
                  Sign in here
                </Link>
              </p>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <p className="text-center text-[11px] text-dark-gray/60 mt-8 font-medium">
          &copy; 2026 Faculty of Computing and Informatics, LAUTECH.
        </p>
      </motion.div>
    </div>
  )
}

