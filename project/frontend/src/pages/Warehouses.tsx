import { useEffect, useMemo, useState } from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'

import { warehouseApi } from '@/api/warehouse'
import { useUIStore } from '@/store'
import { PageHeader } from '@/components/shared/PageHeader'
import { EmptyState } from '@/components/shared/EmptyState'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

export default function Warehouses() {
  const queryClient = useQueryClient()
  const { setPageTitle, setBreadcrumbs } = useUIStore()

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [searchValue, setSearchValue] = useState('')
  const [addingLocation, setAddingLocation] = useState(false)
  const [newLocationName, setNewLocationName] = useState('')
  const [newLocationCode, setNewLocationCode] = useState('')
  const [deleteLocationId, setDeleteLocationId] = useState<string | null>(null)
  const [createWarehouseOpen, setCreateWarehouseOpen] = useState(false)
  const [newWarehouseName, setNewWarehouseName] = useState('')
  const [newWarehouseCode, setNewWarehouseCode] = useState('')
  const [newWarehouseAddress, setNewWarehouseAddress] = useState('')

  const [draftName, setDraftName] = useState('')
  const [draftCode, setDraftCode] = useState('')
  const [draftAddress, setDraftAddress] = useState('')

  useEffect(() => {
    setPageTitle('Warehouses')
    setBreadcrumbs([])
  }, [setPageTitle, setBreadcrumbs])

  const { data: warehouses = [], isLoading } = useQuery({
    queryKey: ['warehouses'],
    queryFn: () => warehouseApi.getAll(),
  })

  useEffect(() => {
    const firstWarehouse = warehouses[0]
    if (!selectedId && firstWarehouse) {
      setSelectedId(firstWarehouse.id)
    }
  }, [selectedId, warehouses])

  const selected = warehouses.find((w) => w.id === selectedId) || null

  useEffect(() => {
    if (!selected) return
    setDraftName(selected.name)
    setDraftCode(selected.shortCode)
    setDraftAddress(selected.address)
  }, [selected])

  const { data: locations = [] } = useQuery({
    queryKey: ['warehouse-locations', selectedId],
    queryFn: () => warehouseApi.getLocations(selectedId as string),
    enabled: Boolean(selectedId),
  })

  const updateWarehouseMutation = useMutation({
    mutationFn: () =>
      warehouseApi.update(selectedId as string, {
        name: draftName,
        shortCode: draftCode,
        address: draftAddress,
      }),
    onSuccess: () => {
      toast.success('Warehouse updated')
      queryClient.invalidateQueries({ queryKey: ['warehouses'] })
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : 'Failed to update warehouse'),
  })

  const createLocationMutation = useMutation({
    mutationFn: () =>
      warehouseApi.createLocation(selectedId as string, {
        name: newLocationName,
        shortCode: newLocationCode,
      }),
    onSuccess: () => {
      toast.success('Location created')
      setAddingLocation(false)
      setNewLocationName('')
      setNewLocationCode('')
      queryClient.invalidateQueries({ queryKey: ['warehouse-locations', selectedId] })
      queryClient.invalidateQueries({ queryKey: ['warehouses'] })
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : 'Failed to create location'),
  })

  const deleteLocationMutation = useMutation({
    mutationFn: (locationId: string) => warehouseApi.deleteLocation(selectedId as string, locationId),
    onSuccess: () => {
      toast.success('Location deleted')
      setDeleteLocationId(null)
      queryClient.invalidateQueries({ queryKey: ['warehouse-locations', selectedId] })
      queryClient.invalidateQueries({ queryKey: ['warehouses'] })
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : 'Failed to delete location'),
  })

  const createWarehouseMutation = useMutation({
    mutationFn: () =>
      warehouseApi.create({
        name: newWarehouseName.trim(),
        shortCode: newWarehouseCode.trim(),
        address: newWarehouseAddress.trim() || undefined,
      }),
    onSuccess: (created) => {
      toast.success('Warehouse created')
      setCreateWarehouseOpen(false)
      setNewWarehouseName('')
      setNewWarehouseCode('')
      setNewWarehouseAddress('')
      queryClient.invalidateQueries({ queryKey: ['warehouses'] })
      setSelectedId(created.id)
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : 'Failed to create warehouse'),
  })

  const filteredWarehouses = useMemo(
    () => warehouses.filter((w) => !searchValue || w.name.toLowerCase().includes(searchValue.toLowerCase())),
    [searchValue, warehouses]
  )

  return (
    <div className="space-y-6">
      <PageHeader title="Warehouses" count={warehouses.length} />

      <div className="flex gap-6" style={{ minHeight: '70vh' }}>
        <div className="w-80 flex-shrink-0 space-y-4">
          <Dialog open={createWarehouseOpen} onOpenChange={setCreateWarehouseOpen}>
            <DialogTrigger asChild>
              <Button className="w-full gap-2">
                <Plus className="w-4 h-4" /> Add Warehouse
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>New Warehouse</DialogTitle>
                <DialogDescription>Create a warehouse to receive, transfer, and deliver stock.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-500">Name</label>
                  <Input value={newWarehouseName} onChange={(e) => setNewWarehouseName(e.target.value)} placeholder="Main Store" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-500">Short Code</label>
                  <Input value={newWarehouseCode} onChange={(e) => setNewWarehouseCode(e.target.value.toUpperCase())} placeholder="MST" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-500">Address</label>
                  <textarea
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                    rows={2}
                    value={newWarehouseAddress}
                    onChange={(e) => setNewWarehouseAddress(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setCreateWarehouseOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={() => createWarehouseMutation.mutate()}
                  disabled={!newWarehouseName.trim() || !newWarehouseCode.trim() || createWarehouseMutation.isPending}
                >
                  {createWarehouseMutation.isPending ? 'Creating...' : 'Create Warehouse'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Input placeholder="Search warehouses..." value={searchValue} onChange={(e) => setSearchValue(e.target.value)} className="text-sm" />

          <div className="space-y-3">
            {filteredWarehouses.map((wh) => (
              <Card
                key={wh.id}
                className={cn(
                  'p-4 cursor-pointer transition-all',
                  selectedId === wh.id
                    ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-900/10 dark:border-indigo-500'
                    : 'hover:border-slate-300'
                )}
                onClick={() => setSelectedId(wh.id)}
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                    <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-6l-2-2H5a2 2 0 0 0-2 2z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-slate-900 dark:text-white">{wh.name}</span>
                      <Badge variant="secondary" className="font-mono text-[10px] px-1.5">
                        {wh.shortCode}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-400 truncate mt-0.5">{wh.address || 'No address'}</p>
                    <div className="flex gap-2 mt-2">
                      <span className="text-xs bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full text-slate-500">
                        {wh.locationCount} locations
                      </span>
                      <span className="text-xs bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full text-slate-500">
                        {wh.productCount} products
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
          {!isLoading && filteredWarehouses.length === 0 && (
            <EmptyState title="No warehouses found" description="Try adjusting your search." />
          )}
        </div>

        <div className="flex-1">
          {!selected ? (
            <div className="h-full flex items-center justify-center">
              <EmptyState title="Select a warehouse" description="Choose a warehouse from the left panel to view details" />
            </div>
          ) : (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Warehouse Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-slate-500">Name</label>
                      <Input value={draftName} onChange={(e) => setDraftName(e.target.value)} />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-slate-500">Short Code</label>
                      <Input value={draftCode} onChange={(e) => setDraftCode(e.target.value)} />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-500">Address</label>
                    <textarea className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" rows={2} value={draftAddress} onChange={(e) => setDraftAddress(e.target.value)} />
                  </div>
                  <Button size="sm" onClick={() => updateWarehouseMutation.mutate()} disabled={updateWarehouseMutation.isPending}>
                    {updateWarehouseMutation.isPending ? 'Saving...' : 'Save Changes'}
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex-row items-center justify-between">
                  <CardTitle className="text-base">Locations</CardTitle>
                  <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setAddingLocation(true)}>
                    <Plus className="w-3.5 h-3.5" /> Add Location
                  </Button>
                </CardHeader>
                <CardContent>
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-700">
                        <th className="text-left text-table-header uppercase text-slate-500 pb-3">Name</th>
                        <th className="text-left text-table-header uppercase text-slate-500 pb-3">Code</th>
                        <th className="text-left text-table-header uppercase text-slate-500 pb-3">Parent</th>
                        <th className="text-right text-table-header uppercase text-slate-500 pb-3 w-24">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {locations.map((loc) => (
                        <tr key={loc.id} className="border-b border-slate-50 dark:border-slate-800/50 h-12">
                          <td className="text-sm">
                            <div className="flex items-center gap-2">
                              {loc.parentId && <span className="text-slate-300 pl-4 border-l-2 border-dashed border-slate-300">?</span>}
                              <span className="font-medium text-slate-900 dark:text-white">{loc.name}</span>
                            </div>
                          </td>
                          <td>
                            <Badge variant="secondary" className="font-mono text-[10px]">
                              {loc.shortCode}
                            </Badge>
                          </td>
                          <td className="text-sm text-slate-500">{loc.parentId ? locations.find((l) => l.id === loc.parentId)?.name || '�' : '�'}</td>
                          <td className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button variant="ghost" size="icon" className="h-7 w-7" disabled>
                                <Pencil className="w-3.5 h-3.5" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500" onClick={() => setDeleteLocationId(loc.id)}>
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}

                      {addingLocation && (
                        <tr className="bg-indigo-50/50 dark:bg-indigo-900/10">
                          <td className="py-2 pr-2">
                            <Input placeholder="Location name" value={newLocationName} onChange={(e) => setNewLocationName(e.target.value)} className="h-8 text-sm" autoFocus />
                          </td>
                          <td className="py-2 pr-2">
                            <Input placeholder="Code" value={newLocationCode} onChange={(e) => setNewLocationCode(e.target.value)} className="h-8 text-sm w-20" />
                          </td>
                          <td></td>
                          <td className="text-right py-2">
                            <div className="flex justify-end gap-1">
                              <Button size="sm" variant="ghost" onClick={() => setAddingLocation(false)}>
                                Cancel
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => createLocationMutation.mutate()}
                                disabled={!newLocationName || !newLocationCode || createLocationMutation.isPending}
                              >
                                Save
                              </Button>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                  {locations.length === 0 && !addingLocation && (
                    <EmptyState title="No locations" description="Add locations to organize stock within this warehouse" />
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={Boolean(deleteLocationId)}
        onOpenChange={(open) => {
          if (!open) setDeleteLocationId(null)
        }}
        title="Delete location"
        description="This location will be removed permanently."
        variant="danger"
        loading={deleteLocationMutation.isPending}
        confirmLabel="Delete"
        onConfirm={() => {
          if (deleteLocationId) deleteLocationMutation.mutate(deleteLocationId)
        }}
      />
    </div>
  )
}
