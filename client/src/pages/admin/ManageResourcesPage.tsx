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
import { Textarea } from '@/components/ui/textarea'
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
import ResourceImage from '@/components/shared/ResourceImage'

function FormImagePreview({ src, onRemove }: { src: string | null | undefined; onRemove: () => void }) {
  const [error, setError] = useState(false)

  useEffect(() => {
    setError(false)
  }, [src])

  if (!src || error) {
    return (
      <div className="w-20 h-20 rounded-lg border border-dashed border-mid-gray flex items-center justify-center bg-light-gray text-dark-gray flex-shrink-0">
        <Server className="w-8 h-8 opacity-40" />
      </div>
    )
  }

  return (
    <div className="relative w-20 h-20 rounded-lg overflow-hidden border border-mid-gray/30 group flex-shrink-0">
      <img
        src={src}
        alt="Preview"
        onError={() => setError(true)}
        className="w-full h-full object-cover"
      />
      <button
        type="button"
        onClick={onRemove}
        className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white text-[10px] font-bold"
      >
        Remove
      </button>
    </div>
  )
}

interface ResourceForm {
  name: string
  type: string
  capacity: string
  status: string
  description: string
  image: File | string | null
}

const emptyForm: ResourceForm = { name: '', type: '', capacity: '', status: 'active', description: '', image: null }

export default function ManageResourcesPage() {
  const [resources, setResources] = useState<Resource[]>([])
  const [loading, setLoading] = useState(true)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<ResourceForm>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  const [toggleDialog, setToggleDialog] = useState<{ open: boolean; id: string; name: string; newStatus: string }>({
    open: false, id: '', name: '', newStatus: '',
  })

  useEffect(() => {
    if (!form.image) {
      setPreviewUrl(null)
      return
    }
    if (form.image instanceof File) {
      const objectUrl = URL.createObjectURL(form.image)
      setPreviewUrl(objectUrl)
      return () => URL.revokeObjectURL(objectUrl)
    }
    setPreviewUrl(form.image)
  }, [form.image])

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
      description: r.description || '',
      image: r.image || null,
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
        description: form.description || '',
        image: form.image,
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
                      <TableCell className="font-bold">
                        <div className="flex items-center gap-3">
                          <ResourceImage src={r.image} name={r.name} type={r.type} />
                          <div>
                            <span className="block text-accent font-bold">{r.name}</span>
                            {r.description && (
                              <span className="block text-[11px] text-dark-gray font-normal mt-0.5 max-w-[250px] truncate" title={r.description}>
                                {r.description}
                              </span>
                            )}
                          </div>
                        </div>
                      </TableCell>
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
        <DialogContent className="sm:max-w-[450px] w-[95vw] max-h-[85vh] flex flex-col overflow-hidden p-0 gap-0">
          <DialogHeader className="p-6 pb-4 border-b">
            <DialogTitle>{editingId ? 'Edit Resource' : 'Add New Resource'}</DialogTitle>
            <DialogDescription>
              {editingId ? 'Update the resource details below.' : 'Fill in the details to add a new faculty resource.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4 px-6 overflow-y-auto flex-1 max-h-[50vh] sm:max-h-[55vh]">
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
              <Label>Description (Optional)</Label>
              <Textarea
                placeholder="e.g. Fully equipped computer laboratory with 40 workstations and projector support."
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>Resource Image (Optional)</Label>
              <div className="flex items-center gap-4">
                <FormImagePreview src={previewUrl} onRemove={() => setForm({ ...form, image: null })} />
                <div className="flex-1">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null
                      setForm({ ...form, image: file })
                    }}
                    className="cursor-pointer text-xs h-10"
                  />
                  <p className="text-[10px] text-dark-gray mt-1">
                    PNG, JPG or JPEG. Max 20MB.
                  </p>
                </div>
              </div>
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

          <DialogFooter className="m-0 p-6 bg-light-gray/30 border-t rounded-b-xl">
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
