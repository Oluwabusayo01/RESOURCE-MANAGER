import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { userService } from '@/lib/apiService'

import StatusBadge from '@/components/shared/StatusBadge'
import ConfirmDialog from '@/components/shared/ConfirmDialog'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

import { CheckCircle2, XCircle, ShieldOff, Users, RotateCcw } from 'lucide-react'
import { toast } from 'sonner'

interface UserItem {
  id: string
  name: string
  email: string
  role: string
  department: string
  status: string
}

export default function ManageUsersPage() {
  const [users, setUsers] = useState<UserItem[]>([])
  const [loading, setLoading] = useState(true)

  // Filters
  const [roleFilter, setRoleFilter] = useState('all')
  const [deptFilter, setDeptFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')

  // Confirm dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean
    id: string
    name: string
    action: 'approve' | 'reject' | 'revoke' | 'reapprove'
  }>({ open: false, id: '', name: '', action: 'approve' })

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const data = await userService.getAll()
      setUsers(data)
    } catch (err) {
      console.error('Failed to load users', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  // Client-side filtering
  const filteredUsers = useMemo(() => {
    let result = users
    if (roleFilter !== 'all') result = result.filter(u => u.role === roleFilter)
    if (deptFilter !== 'all') result = result.filter(u => u.department === deptFilter)
    if (statusFilter !== 'all') result = result.filter(u => u.status === statusFilter)
    return result
  }, [users, roleFilter, deptFilter, statusFilter])

  const handleConfirm = async () => {
    const { id, action } = confirmDialog
    try {
      if (action === 'approve' || action === 'reapprove') {
        await userService.approve(id)
        toast.success('User approved successfully.')
      } else if (action === 'reject' || action === 'revoke') {
        await userService.reject(id)
        toast.success(action === 'revoke' ? 'Access revoked.' : 'User rejected.')
      }
      setConfirmDialog({ open: false, id: '', name: '', action: 'approve' })
      fetchUsers()
    } catch (err: any) {
      toast.error(err.message || 'Action failed.')
    }
  }

  const getConfirmProps = () => {
    const { action, name } = confirmDialog
    switch (action) {
      case 'approve':
        return {
          title: 'Approve User',
          description: `Approve ${name}'s registration? They will gain access to the system.`,
          confirmLabel: 'Approve',
        }
      case 'reject':
        return {
          title: 'Reject Registration',
          description: `Reject ${name}'s registration? They will not be able to access the system.`,
          confirmLabel: 'Reject',
        }
      case 'revoke':
        return {
          title: 'Revoke Access',
          description: `Revoke ${name}'s access? Their account will be deactivated.`,
          confirmLabel: 'Revoke Access',
        }
      case 'reapprove':
        return {
          title: 'Re-approve User',
          description: `Re-approve ${name}? They will regain access to the system.`,
          confirmLabel: 'Re-approve',
        }
    }
  }

  const resetFilters = () => {
    setRoleFilter('all')
    setDeptFilter('all')
    setStatusFilter('all')
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-8"
    >
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black text-accent">Manage Users</h1>
        <p className="text-dark-gray text-sm mt-1">View, approve, and manage user registrations.</p>
      </div>

      {/* Filter Bar */}
      <Card className="border border-mid-gray/20 shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-end gap-4">
            <div className="space-y-1 min-w-[150px]">
              <Label className="text-xs font-bold text-dark-gray uppercase">Role</Label>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="classrep">Class Rep</SelectItem>
                  <SelectItem value="staff">Staff</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1 min-w-[180px]">
              <Label className="text-xs font-bold text-dark-gray uppercase">Department</Label>
              <Select value={deptFilter} onValueChange={setDeptFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  <SelectItem value="Computer Science">Computer Science</SelectItem>
                  <SelectItem value="Cyber Security">Cyber Security</SelectItem>
                  <SelectItem value="Information Systems Sciences (INS)">INS</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1 min-w-[150px]">
              <Label className="text-xs font-bold text-dark-gray uppercase">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button variant="outline" size="sm" onClick={resetFilters} className="gap-1 font-bold text-dark-gray">
              <RotateCcw className="w-3 h-3" />
              Reset
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card className="border border-mid-gray/20 shadow-sm overflow-hidden">
        <CardContent className="p-0">
          <div className="flex items-center justify-between p-5 border-b">
            <h2 className="text-lg font-black text-accent">Users</h2>
            {!loading && (
              <span className="text-xs font-bold text-dark-gray bg-light-gray px-3 py-1 rounded-full">
                {filteredUsers.length} user{filteredUsers.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>

          {loading ? (
            <div className="p-5 space-y-4">
              {[1, 2, 3, 4].map(i => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="p-12 text-center">
              <Users className="w-12 h-12 text-mid-gray mx-auto mb-3" />
              <p className="text-dark-gray font-medium">No users found.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-bold">Name</TableHead>
                  <TableHead className="font-bold">Email</TableHead>
                  <TableHead className="font-bold">Role</TableHead>
                  <TableHead className="font-bold">Department</TableHead>
                  <TableHead className="font-bold">Status</TableHead>
                  <TableHead className="font-bold text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((u) => (
                  <TableRow key={u.id} className="hover:bg-light-gray/50">
                    <TableCell className="font-bold">{u.name}</TableCell>
                    <TableCell className="text-dark-gray text-sm">{u.email}</TableCell>
                    <TableCell>
                      <span className="text-xs font-bold px-2 py-1 bg-light-gray rounded-full capitalize">
                        {u.role === 'classrep' ? 'Class Rep' : u.role}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm">{u.department}</TableCell>
                    <TableCell><StatusBadge status={u.status as any} /></TableCell>
                    <TableCell className="text-right space-x-2">
                      {u.status === 'pending' && (
                        <>
                          <Button
                            size="sm"
                            onClick={() => setConfirmDialog({ open: true, id: u.id, name: u.name, action: 'approve' })}
                            className="bg-green-600 text-white hover:bg-green-700 text-xs font-bold"
                          >
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setConfirmDialog({ open: true, id: u.id, name: u.name, action: 'reject' })}
                            className="border-red-300 text-red-600 hover:bg-red-50 text-xs font-bold"
                          >
                            <XCircle className="w-3 h-3 mr-1" />
                            Reject
                          </Button>
                        </>
                      )}
                      {u.status === 'approved' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setConfirmDialog({ open: true, id: u.id, name: u.name, action: 'revoke' })}
                          className="border-red-300 text-red-600 hover:bg-red-50 text-xs font-bold"
                        >
                          <ShieldOff className="w-3 h-3 mr-1" />
                          Revoke Access
                        </Button>
                      )}
                      {u.status === 'rejected' && (
                        <Button
                          size="sm"
                          onClick={() => setConfirmDialog({ open: true, id: u.id, name: u.name, action: 'reapprove' })}
                          className="bg-green-600 text-white hover:bg-green-700 text-xs font-bold"
                        >
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          Re-approve
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.open}
        {...getConfirmProps()}
        onConfirm={handleConfirm}
        onCancel={() => setConfirmDialog({ open: false, id: '', name: '', action: 'approve' })}
      />
    </motion.div>
  )
}

function Label({ children, className }: { children: React.ReactNode; className?: string }) {
  return <p className={className}>{children}</p>
}
