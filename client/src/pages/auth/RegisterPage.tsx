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
      const message = err.message || err.response?.data?.message || 'Something went wrong.'
      if (message.toLowerCase().includes('email') || message.toLowerCase().includes('exists')) {
        setError('An account with this email already exists.')
      } else {
        setError(message)
        toast.error(message)
      }
    } finally {
      setLoading(false)
    }
  }

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
          <p className="text-dark-gray text-sm mt-2">Create your account</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Inline Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-lg font-medium">
              {error}
            </div>
          )}

          {/* Full Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input id="name" placeholder="e.g. Chukwuemeka Obi" {...register('name')} />
            {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input 
              id="email" 
              type="email" 
              placeholder="e.g. solatubosun92@student.lautech.edu.ng" 
              {...register('email')} 
            />
            <p className="text-[10px] text-dark-gray font-medium flex items-center gap-1">
              <span className="w-1 h-1 bg-gold rounded-full" />
              Must be a valid LAUTECH institutional email.
            </p>
            {errors.email && <p className="text-xs text-red-500 font-medium">{errors.email.message}</p>}
          </div>

          {/* Password */}
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Min. 6 characters"
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

          {/* Confirm Password */}
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirm ? 'text' : 'password'}
                placeholder="Re-enter password"
                {...register('confirmPassword')}
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-gray hover:text-accent transition-colors"
              >
                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.confirmPassword && <p className="text-xs text-red-500">{errors.confirmPassword.message}</p>}
          </div>

          {/* Department */}
          <div className="space-y-2">
            <Label>Department</Label>
            <Select onValueChange={(val) => setValue('department', val)}>
              <SelectTrigger>
                <SelectValue placeholder="Select your department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Computer Science">Computer Science</SelectItem>
                <SelectItem value="Cyber Security">Cyber Security</SelectItem>
                <SelectItem value="Information Systems Sciences (INS)">Information Systems Sciences (INS)</SelectItem>
              </SelectContent>
            </Select>
            {errors.department && <p className="text-xs text-red-500">{errors.department.message}</p>}
          </div>

          {/* Role — Clickable Cards */}
          <div className="space-y-2">
            <Label>Role</Label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setValue('role', 'classrep', { shouldValidate: true })}
                className={cn(
                  "relative flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all duration-200 cursor-pointer",
                  selectedRole === 'classrep'
                    ? "border-accent bg-light-gray"
                    : "border-mid-gray/40 hover:border-mid-gray"
                )}
              >
                {selectedRole === 'classrep' && (
                  <CheckCircle2 className="absolute top-2 right-2 w-4 h-4 text-gold" />
                )}
                <Users className={cn("w-6 h-6", selectedRole === 'classrep' ? "text-gold" : "text-dark-gray")} />
                <span className={cn("text-sm font-bold", selectedRole === 'classrep' ? "text-accent" : "text-dark-gray")}>
                  Class Representative
                </span>
              </button>

              <button
                type="button"
                onClick={() => setValue('role', 'staff', { shouldValidate: true })}
                className={cn(
                  "relative flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all duration-200 cursor-pointer",
                  selectedRole === 'staff'
                    ? "border-accent bg-light-gray"
                    : "border-mid-gray/40 hover:border-mid-gray"
                )}
              >
                {selectedRole === 'staff' && (
                  <CheckCircle2 className="absolute top-2 right-2 w-4 h-4 text-gold" />
                )}
                <GraduationCap className={cn("w-6 h-6", selectedRole === 'staff' ? "text-gold" : "text-dark-gray")} />
                <span className={cn("text-sm font-bold", selectedRole === 'staff' ? "text-accent" : "text-dark-gray")}>
                  Staff
                </span>
              </button>
            </div>
            {errors.role && <p className="text-xs text-red-500">{errors.role.message}</p>}
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
                Creating Account...
              </span>
            ) : (
              'Create Account'
            )}
          </Button>
        </form>

        {/* Login Link */}
        <p className="text-center text-sm text-dark-gray mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-gold font-bold hover:underline">
            Login
          </Link>
        </p>
      </div>
    </motion.div>
  )
}
