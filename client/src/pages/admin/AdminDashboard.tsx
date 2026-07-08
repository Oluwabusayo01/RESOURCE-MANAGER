import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { formatDistanceToNow } from 'date-fns'
import { userService, adminService } from '@/lib/apiService'
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
  Home,
} from 'lucide-react'
import { toast } from 'sonner'

interface AdminStats {
  totalBookingsThisMonth: number
  pendingUsers: number
  totalUsers: number
  mostBookedResource: {
    bookingCount: number
    id: string
    name: string
  } | null
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

const format12Hour = (timeStr: string) => {
  if (!timeStr) return ''
  const [hourStr] = timeStr.split(':')
  const hour = parseInt(hourStr, 10)
  const ampm = hour >= 12 ? 'PM' : 'AM'
  const hour12 = hour % 12 === 0 ? 12 : hour % 12
  return `${hour12}${ampm}`
}

export default function AdminDashboard() {
  const navigate = useNavigate()
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [deptData, setDeptData] = useState<DeptData[]>([])
  const [peakData, setPeakData] = useState<HourData[]>([])
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([])
  const [activity, setActivity] = useState<ActivityItem[]>([])
  const [loading, setLoading] = useState(true)
  const [rejectDialog, setRejectDialog] = useState<{ open: boolean; id: string; name: string }>({ open: false, id: '', name: '' })

  // Pagination states for Recent Activity tab
  const [activeTab, setActiveTab] = useState<'overview' | 'activity'>('overview')
  const [activityPage, setActivityPage] = useState(1)
  const [paginatedActivity, setPaginatedActivity] = useState<ActivityItem[]>([])
  const [paginationInfo, setPaginationInfo] = useState<{
    total: number
    page: number
    limit: number
    totalPages: number
    hasNextPage: boolean
  } | null>(null)
  const [paginatedLoading, setPaginatedLoading] = useState(false)

  const fetchPaginatedActivity = async (page: number) => {
    setPaginatedLoading(true)
    try {
      const res = await adminService.getActivity({ page, limit: 10 })
      setPaginatedActivity(res.data || [])
      setPaginationInfo(res.pagination || null)
      setActivityPage(page)
    } catch (err) {
      console.error("Failed to fetch paginated activity", err)
      toast.error("Failed to load activity log.")
    } finally {
      setPaginatedLoading(false)
    }
  }

  const fetchData = async () => {
    setLoading(true)
    try {
      const [statsRes, deptRes, peakRes, pendingUsersRes, activityRes] = await Promise.all([
        adminService.getStats().catch(e => {
          console.error("Failed to fetch admin stats:", e)
          return null
        }),
        adminService.getByDepartment().catch(e => {
          console.error("Failed to fetch department stats:", e)
          return []
        }),
        adminService.getPeakHours().catch(e => {
          console.error("Failed to fetch peak hours:", e)
          return []
        }),
        userService.getAll({ status: 'pending' }).catch(e => {
          console.error("Failed to fetch pending users:", e)
          return { users: [] }
        }),
        adminService.getActivity({ limit: 10 }).catch(e => {
          console.error("Failed to fetch activity:", e)
          return { data: [], pagination: null }
        })
      ])

      setStats(statsRes)
      setDeptData(deptRes || [])
      
      const formattedPeak = (peakRes || []).map((item: any) => ({
        ...item,
        hour: format12Hour(item.hour)
      }))
      setPeakData(formattedPeak)
      
      setPendingUsers(pendingUsersRes?.users || [])
      setActivity(activityRes?.data || [])

    } catch (err) {
      console.error('Failed to load admin dashboard data', err)
      toast.error("Failed to load dashboard data.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    if (activeTab === 'activity') {
      fetchPaginatedActivity(activityPage)
    }
  }, [activeTab, activityPage])

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
        { label: 'Bookings This Month', value: stats.totalBookingsThisMonth, icon: CalendarCheck, color: 'text-blue-500', bg: 'bg-blue-50' },
        { label: 'Pending Registrations', value: stats.pendingUsers, icon: UserPlus, color: 'text-gold', bg: 'bg-gold/10' },
        { label: 'Registered Users', value: stats.totalUsers, icon: Users, color: 'text-purple-500', bg: 'bg-purple-50' },
        { label: 'Most Booked', value: stats.mostBookedResource?.name || 'None', icon: Trophy, color: 'text-green-500', bg: 'bg-green-50', isText: true },
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-3xl font-black text-accent">Admin Dashboard</h1>
          <p className="text-dark-gray text-[10px] sm:text-sm mt-1">Faculty of Computing and Informatics, LAUTECH</p>
        </div>
        <div className="flex items-center gap-4 self-end sm:self-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/')}
            className="font-bold gap-1 text-xs border-mid-gray/20 hover:bg-light-gray"
          >
            <Home className="w-4 h-4" />
            Home Page
          </Button>
          <NotificationBell />
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex border-b border-mid-gray/20 pb-px gap-2">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2.5 font-bold text-xs sm:text-sm border-b-2 transition-all relative ${
            activeTab === 'overview'
              ? 'border-gold text-gold'
              : 'border-transparent text-dark-gray hover:text-accent'
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab('activity')}
          className={`px-4 py-2.5 font-bold text-xs sm:text-sm border-b-2 transition-all relative ${
            activeTab === 'activity'
              ? 'border-gold text-gold'
              : 'border-transparent text-dark-gray hover:text-accent'
          }`}
        >
          Recent Activity
        </button>
      </div>

      {activeTab === 'overview' ? (
        <>
          {/* 2. Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
          <div className="grid grid-cols-1 gap-6">
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
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={peakData} margin={{ bottom: 45, left: 0, right: 10, top: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis
                        dataKey="hour"
                        interval={0}
                        tick={{ fontSize: 9, fill: '#777', angle: -45, textAnchor: 'end' }}
                        tickLine={false}
                        axisLine={{ stroke: '#eee' }}
                        height={65}
                      />
                      <YAxis tick={{ fontSize: 11, fill: '#555' }} allowDecimals={false} width={28} />
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
                <h2 className="text-base sm:text-lg font-black text-accent whitespace-nowrap">Pending Approvals</h2>
                {!loading && (
                  <span className="text-[10px] sm:text-xs font-bold text-gold bg-gold/10 px-2 sm:px-3 py-1 rounded-full whitespace-nowrap">
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
                <div className="overflow-x-auto">
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
                        <TableRow key={u.id} className="hover:bg-light-gray/50 text-xs sm:text-sm">
                          <TableCell className="font-bold whitespace-nowrap">{u.name}</TableCell>
                          <TableCell className="text-dark-gray whitespace-nowrap">{u.email}</TableCell>
                          <TableCell className="whitespace-nowrap">
                            <span className="text-[10px] font-bold px-2 py-1 bg-light-gray rounded-full capitalize">
                              {u.role === 'classrep' ? 'Class Rep' : u.role}
                            </span>
                          </TableCell>
                          <TableCell className="text-xs whitespace-nowrap">{u.department}</TableCell>
                          <TableCell className="text-right space-x-2 whitespace-nowrap">
                            <Button
                              size="sm"
                              onClick={() => handleApprove(u.id)}
                              className="bg-green-600 text-white hover:bg-green-700 text-[10px] sm:text-xs font-bold h-8 px-2 sm:px-3"
                            >
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setRejectDialog({ open: true, id: u.id, name: u.name })}
                              className="border-red-300 text-red-600 hover:bg-red-50 text-[10px] sm:text-xs font-bold h-8 px-2 sm:px-3"
                            >
                              <XCircle className="w-3 h-3 mr-1" />
                              Reject
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 5. Recent Activity Feed (Limit to max 3 items) */}
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
                <>
                  <div className="divide-y">
                    {activity.slice(0, 3).map((a) => (
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

                  <div className="p-4 border-t flex justify-center">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setActiveTab('activity')}
                      className="font-bold text-xs gap-1 border-mid-gray/20 hover:bg-light-gray"
                    >
                      View All Activity
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </>
      ) : (
        /* Detailed Activity Log Tab */
        <Card className="border border-mid-gray/20 shadow-sm">
          <CardContent className="p-0">
            <div className="p-5 border-b flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-lg font-black text-accent">Recent Activity Log</h2>
                <p className="text-xs text-dark-gray mt-1">Full audit trail of bookings and registrations</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActiveTab('overview')}
                className="font-bold text-xs border-mid-gray/20 hover:bg-light-gray"
              >
                Back to Dashboard
              </Button>
            </div>

            {paginatedLoading ? (
              <div className="p-5 space-y-4">
                {[1, 2, 3, 4, 5].map(i => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : paginatedActivity.length === 0 ? (
              <div className="p-12 text-center">
                <p className="text-dark-gray text-sm">No activity found in the last 48 hours.</p>
              </div>
            ) : (
              <>
                <div className="divide-y">
                  {paginatedActivity.map((a) => (
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

                {paginationInfo && paginationInfo.totalPages > 1 && (
                  <div className="p-4 border-t flex flex-col sm:flex-row justify-between items-center gap-4">
                    <span className="text-xs font-semibold text-dark-gray">
                      Showing page {paginationInfo.page} of {paginationInfo.totalPages} (Total: {paginationInfo.total})
                    </span>
                    <div className="flex items-center gap-1 sm:gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => fetchPaginatedActivity(activityPage - 1)}
                        disabled={activityPage <= 1 || paginatedLoading}
                        className="font-bold text-xs h-8 px-3"
                      >
                        Previous
                      </Button>
                      
                      {Array.from({ length: paginationInfo.totalPages }, (_, i) => i + 1).map((p) => (
                        <Button
                          key={p}
                          variant={p === activityPage ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => fetchPaginatedActivity(p)}
                          disabled={paginatedLoading}
                          className={`w-8 h-8 p-0 text-xs font-bold ${
                            p === activityPage ? 'bg-gold hover:bg-gold/90 text-white' : ''
                          }`}
                        >
                          {p}
                        </Button>
                      ))}

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => fetchPaginatedActivity(activityPage + 1)}
                        disabled={activityPage >= paginationInfo.totalPages || paginatedLoading}
                        className="font-bold text-xs h-8 px-3"
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      )}

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
