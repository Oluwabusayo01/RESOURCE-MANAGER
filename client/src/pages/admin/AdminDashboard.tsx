import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { formatDistanceToNow } from 'date-fns'
import { adminService, userService } from '@/lib/apiService'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts'

import NotificationBell from '@/components/shared/NotificationBell'
import ConfirmDialog from '@/components/shared/ConfirmDialog'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

import {
  CalendarCheck,
  Users,
  UserPlus,
  Trophy,
  CheckCircle2,
  XCircle,
  Activity,
  CalendarPlus,
  UserCheck,
} from 'lucide-react'
import { toast } from 'sonner'

interface AdminStats {
  totalBookings: number
  pendingUsers: number
  totalUsers: number
  mostBookedResource: string
}

interface DeptData {
  department: string
  count: number
}

interface HourData {
  hour: string
  count: number
}

interface PendingUser {
  id: string
  name: string
  email: string
  role: string
  department: string
  status: string
}

interface ActivityItem {
  id: string
  type: string
  description: string
  timestamp: string
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [deptData, setDeptData] = useState<DeptData[]>([])
  const [peakData, setPeakData] = useState<HourData[]>([])
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([])
  const [activity, setActivity] = useState<ActivityItem[]>([])
  const [loading, setLoading] = useState(true)
  const [rejectDialog, setRejectDialog] = useState<{ open: boolean; id: string; name: string }>({ open: false, id: '', name: '' })

  const fetchData = async () => {
    setLoading(true)
    try {
      const [statsData, deptRes, peakRes, usersRes, activityRes] = await Promise.all([
        adminService.getStats(),
        adminService.getByDepartment(),
        adminService.getPeakHours(),
        userService.getAll({ status: 'pending' }),
        adminService.getActivity({ limit: 5 }),
      ])
      setStats(statsData)
      setDeptData(deptRes)
      setPeakData(peakRes)
      setPendingUsers(usersRes)
      setActivity(activityRes)
    } catch (err) {
      console.error('Failed to load admin dashboard data', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleApprove = async (id: string) => {
    try {
      await userService.approve(id)
      toast.success('User approved successfully.')
      fetchData()
    } catch (err: any) {
      toast.error(err.message || 'Failed to approve user.')
    }
  }

  const handleReject = async () => {
    try {
      await userService.reject(rejectDialog.id)
      toast.success('User registration rejected.')
      setRejectDialog({ open: false, id: '', name: '' })
      fetchData()
    } catch (err: any) {
      toast.error(err.message || 'Failed to reject user.')
    }
  }

  const statCards = stats
    ? [
        { label: 'Total Bookings', value: stats.totalBookings, icon: CalendarCheck, color: 'text-blue-500', bg: 'bg-blue-50' },
        { label: 'Pending Registrations', value: stats.pendingUsers, icon: UserPlus, color: 'text-gold', bg: 'bg-gold/10' },
        { label: 'Registered Users', value: stats.totalUsers, icon: Users, color: 'text-purple-500', bg: 'bg-purple-50' },
        { label: 'Most Booked', value: stats.mostBookedResource, icon: Trophy, color: 'text-green-500', bg: 'bg-green-50', isText: true },
      ]
    : []

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'booking_created': return <CalendarPlus className="w-4 h-4 text-blue-500" />
      case 'user_registered': return <UserCheck className="w-4 h-4 text-gold" />
      default: return <Activity className="w-4 h-4 text-dark-gray" />
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-8"
    >
      {/* 1. Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-accent">Admin Dashboard</h1>
          <p className="text-dark-gray text-sm mt-1">Faculty of Computing and Informatics, LAUTECH</p>
        </div>
        <NotificationBell />
      </div>

      {/* 2. Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {loading
          ? [1, 2, 3, 4].map(i => (
              <Card key={i} className="border border-mid-gray/20">
                <CardContent className="p-5 space-y-3">
                  <Skeleton className="h-10 w-10 rounded-lg" />
                  <Skeleton className="h-8 w-16" />
                  <Skeleton className="h-4 w-24" />
                </CardContent>
              </Card>
            ))
          : statCards.map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <Card className="border border-mid-gray/20 hover:shadow-md transition-shadow">
                  <CardContent className="p-5">
                    <div className={`w-10 h-10 ${s.bg} rounded-lg flex items-center justify-center mb-3`}>
                      <s.icon className={`w-5 h-5 ${s.color}`} />
                    </div>
                    {'isText' in s && s.isText ? (
                      <p className="text-lg font-black text-accent truncate">{s.value}</p>
                    ) : (
                      <p className="text-3xl font-black text-accent">{s.value}</p>
                    )}
                    <p className="text-xs font-bold text-dark-gray uppercase tracking-wider mt-1">{s.label}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
      </div>

      {/* 3. Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bookings by Department */}
        <Card className="border border-mid-gray/20 shadow-sm">
          <CardContent className="p-6">
            <h2 className="text-sm font-bold text-dark-gray uppercase tracking-wider mb-4">Bookings by Department</h2>
            {loading ? (
              <Skeleton className="h-64 w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={deptData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    dataKey="department"
                    tick={{ fontSize: 11, fill: '#555' }}
                    tickFormatter={(val: string) => val.length > 12 ? val.slice(0, 12) + '…' : val}
                  />
                  <YAxis tick={{ fontSize: 11, fill: '#555' }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      background: '#fff',
                      border: '1px solid #eee',
                      borderRadius: 8,
                      fontSize: 12,
                      fontWeight: 600,
                    }}
                  />
                  <Bar dataKey="count" fill="#C9A84C" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Peak Booking Hours */}
        <Card className="border border-mid-gray/20 shadow-sm">
          <CardContent className="p-6">
            <h2 className="text-sm font-bold text-dark-gray uppercase tracking-wider mb-4">Peak Booking Hours</h2>
            {loading ? (
              <Skeleton className="h-64 w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={peakData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="hour" tick={{ fontSize: 11, fill: '#555' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#555' }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      background: '#fff',
                      border: '1px solid #eee',
                      borderRadius: 8,
                      fontSize: 12,
                      fontWeight: 600,
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="#111111"
                    strokeWidth={2}
                    dot={{ fill: '#C9A84C', strokeWidth: 2, r: 4 }}
                    activeDot={{ fill: '#C9A84C', strokeWidth: 0, r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 4. Pending Registrations Table */}
      <Card className="border border-mid-gray/20 shadow-sm overflow-hidden">
        <CardContent className="p-0">
          <div className="flex items-center justify-between p-5 border-b">
            <h2 className="text-lg font-black text-accent">Pending User Approvals</h2>
            {!loading && (
              <span className="text-xs font-bold text-gold bg-gold/10 px-3 py-1 rounded-full">
                {pendingUsers.length} pending
              </span>
            )}
          </div>

          {loading ? (
            <div className="p-5 space-y-4">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : pendingUsers.length === 0 ? (
            <div className="p-12 text-center">
              <CheckCircle2 className="w-12 h-12 text-green-400 mx-auto mb-3" />
              <p className="text-dark-gray font-medium">No pending registrations. All clear!</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-bold">Name</TableHead>
                  <TableHead className="font-bold">Email</TableHead>
                  <TableHead className="font-bold">Role</TableHead>
                  <TableHead className="font-bold">Department</TableHead>
                  <TableHead className="font-bold text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingUsers.map((u) => (
                  <TableRow key={u.id} className="hover:bg-light-gray/50">
                    <TableCell className="font-bold">{u.name}</TableCell>
                    <TableCell className="text-dark-gray">{u.email}</TableCell>
                    <TableCell>
                      <span className="text-xs font-bold px-2 py-1 bg-light-gray rounded-full capitalize">
                        {u.role === 'classrep' ? 'Class Rep' : u.role}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm">{u.department}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button
                        size="sm"
                        onClick={() => handleApprove(u.id)}
                        className="bg-green-600 text-white hover:bg-green-700 text-xs font-bold"
                      >
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setRejectDialog({ open: true, id: u.id, name: u.name })}
                        className="border-red-300 text-red-600 hover:bg-red-50 text-xs font-bold"
                      >
                        <XCircle className="w-3 h-3 mr-1" />
                        Reject
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* 5. Recent Activity Feed */}
      <Card className="border border-mid-gray/20 shadow-sm">
        <CardContent className="p-0">
          <div className="p-5 border-b">
            <h2 className="text-lg font-black text-accent">Recent Activity</h2>
          </div>

          {loading ? (
            <div className="p-5 space-y-4">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : activity.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-dark-gray text-sm">No recent activity.</p>
            </div>
          ) : (
            <div className="divide-y">
              {activity.map((a) => (
                <div key={a.id} className="flex items-start gap-3 p-4 hover:bg-light-gray/50 transition-colors">
                  <div className="p-2 bg-light-gray rounded-lg mt-0.5">
                    {getActivityIcon(a.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-accent font-medium">{a.description}</p>
                    <p className="text-xs text-mid-gray mt-1">
                      {formatDistanceToNow(new Date(a.timestamp), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Reject Confirm Dialog */}
      <ConfirmDialog
        isOpen={rejectDialog.open}
        title="Reject Registration"
        description={`Are you sure you want to reject ${rejectDialog.name}'s registration? They will not be able to access the system.`}
        confirmLabel="Reject"
        onConfirm={handleReject}
        onCancel={() => setRejectDialog({ open: false, id: '', name: '' })}
      />
    </motion.div>
  )
}
