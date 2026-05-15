import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { resourceService } from '@/lib/apiService'
import type { Resource } from '@/types'
import { cn } from '@/lib/utils'

import StatusBadge from '@/components/shared/StatusBadge'
import ConfirmDialog from '@/components/shared/ConfirmDialog'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
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

import { Plus, Pencil, Power, Loader2, Server } from 'lucide-react'
import { toast } from 'sonner'

interface ResourceForm {
  name: string
  type: string
  capacity: string
  status: string
}

const emptyForm: ResourceForm = { name: '', type: '', capacity: '', status: 'active' }

export default function ManageResourcesPage() {
  const [resources, setResources] = useState<Resource[]>([])
  const [loading, setLoading] = useState(true)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<ResourceForm>(emptyForm)
  const [saving, setSaving] = useState(false)

  const [toggleDialog, setToggleDialog] = useState<{ open: boolean; id: string; name: string; newStatus: string }>({
    open: false, id: '', name: '', newStatus: '',
  })

  const fetchResources = async () => {
    setLoading(true)
    try {
      const data = await resourceService.getAll()
      setResources(data)
    } catch (err) {
      console.error('Failed to load resources', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchResources()
  }, [])

  const openAdd = () => {
    setEditingId(null)
    setForm(emptyForm)
    setDialogOpen(true)
  }

  const openEdit = (r: Resource) => {
    setEditingId(r.id)
    setForm({
      name: r.name,
      type: r.type,
      capacity: r.capacity !== null ? String(r.capacity) : '',
      status: r.status,
    })
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!form.name || !form.type) {
      toast.error('Name and Type are required.')
      return
    }

    setSaving(true)
    try {
      const payload = {
        name: form.name,
        type: form.type,
        capacity: form.capacity ? parseInt(form.capacity, 10) : null,
        status: form.status,
      }

      if (editingId) {
        await resourceService.update(editingId, payload)
        toast.success('Resource updated.')
      } else {
        await resourceService.create(payload)
        toast.success('Resource created.')
      }

      setDialogOpen(false)
      setForm(emptyForm)
      setEditingId(null)
      fetchResources()
    } catch (err: any) {
      toast.error(err.message || 'Failed to save resource.')
    } finally {
      setSaving(false)
    }
  }

  const handleToggle = async () => {
    try {
      await resourceService.toggleStatus(toggleDialog.id, toggleDialog.newStatus)
      toast.success(`Resource ${toggleDialog.newStatus === 'active' ? 'activated' : 'deactivated'}.`)
      setToggleDialog({ open: false, id: '', name: '', newStatus: '' })
      fetchResources()
    } catch (err: any) {
      toast.error(err.message || 'Failed to update status.')
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-8"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-3xl font-black text-accent">Manage Resources</h1>
          <p className="text-dark-gray text-[10px] sm:text-sm mt-1">Add, edit, or deactivate faculty resources.</p>
        </div>
        <Button onClick={openAdd} className="bg-accent text-white hover:bg-accent/90 font-bold gap-2 w-full sm:w-auto h-11 sm:h-10">
          <Plus className="w-4 h-4" />
          Add New Resource
        </Button>
      </div>

      {/* Resources Table */}
      <Card className="border border-mid-gray/20 shadow-sm overflow-hidden">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-5 space-y-4">
              {[1, 2, 3, 4].map(i => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : resources.length === 0 ? (
            <div className="p-12 text-center">
              <Server className="w-12 h-12 text-mid-gray mx-auto mb-3" />
              <p className="text-dark-gray font-medium">No resources found.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-bold whitespace-nowrap">Name</TableHead>
                    <TableHead className="font-bold whitespace-nowrap">Type</TableHead>
                    <TableHead className="font-bold whitespace-nowrap">Capacity</TableHead>
                    <TableHead className="font-bold whitespace-nowrap">Status</TableHead>
                    <TableHead className="font-bold text-right whitespace-nowrap">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {resources.map((r) => (
                    <TableRow key={r.id} className="hover:bg-light-gray/50 text-xs sm:text-sm">
                      <TableCell className="font-bold whitespace-nowrap">{r.name}</TableCell>
                      <TableCell className="capitalize whitespace-nowrap">{r.type}</TableCell>
                      <TableCell className="whitespace-nowrap">{r.capacity ?? '—'}</TableCell>
                      <TableCell className="whitespace-nowrap"><StatusBadge status={r.status} /></TableCell>
                      <TableCell className="text-right space-x-2 whitespace-nowrap">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEdit(r)}
                          className="text-accent h-8 w-8 p-0"
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setToggleDialog({
                            open: true,
                            id: r.id,
                            name: r.name,
                            newStatus: r.status === 'active' ? 'inactive' : 'active',
                          })}
                          className={cn("h-8 w-8 p-0", r.status === 'active' ? 'text-red-500' : 'text-green-500')}
                        >
                          <Power className="w-4 h-4" />
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

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => !open && setDialogOpen(false)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Resource' : 'Add New Resource'}</DialogTitle>
            <DialogDescription>
              {editingId ? 'Update the resource details below.' : 'Fill in the details to add a new faculty resource.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                placeholder="e.g. Computer Lab A"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={form.type} onValueChange={(val) => setForm({ ...form, type: val })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="lab">Lab</SelectItem>
                  <SelectItem value="seminar">Seminar</SelectItem>
                  <SelectItem value="hall">Hall</SelectItem>
                  <SelectItem value="equipment">Equipment</SelectItem>
                  <SelectItem value="meeting">Meeting</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Capacity (Optional)</Label>
              <Input
                type="number"
                min="0"
                placeholder="e.g. 40"
                value={form.capacity}
                onChange={(e) => setForm({ ...form, capacity: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(val) => setForm({ ...form, status: val })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleSave} className="bg-accent text-white hover:bg-accent/90 font-bold" disabled={saving}>
              {saving ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </span>
              ) : (
                editingId ? 'Update Resource' : 'Create Resource'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Toggle Status Confirm */}
      <ConfirmDialog
        isOpen={toggleDialog.open}
        title={toggleDialog.newStatus === 'active' ? 'Activate Resource' : 'Deactivate Resource'}
        description={`Are you sure you want to ${toggleDialog.newStatus === 'active' ? 'activate' : 'deactivate'} "${toggleDialog.name}"?`}
        confirmLabel={toggleDialog.newStatus === 'active' ? 'Activate' : 'Deactivate'}
        onConfirm={handleToggle}
        onCancel={() => setToggleDialog({ open: false, id: '', name: '', newStatus: '' })}
      />
    </motion.div>
  )
}
