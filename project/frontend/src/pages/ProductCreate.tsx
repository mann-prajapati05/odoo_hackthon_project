import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery } from '@tanstack/react-query'
import toast from 'react-hot-toast'

import { productsApi } from '@/api/products'
import { warehouseApi } from '@/api/warehouse'
import { useUIStore } from '@/store'
import { PageHeader } from '@/components/shared/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'

export default function ProductCreate() {
  const navigate = useNavigate()
  const { setPageTitle, setBreadcrumbs } = useUIStore()

  const [name, setName] = useState('')
  const [sku, setSku] = useState('')
  const [uom, setUom] = useState('kg')
  const [description, setDescription] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [reorderEnabled, setReorderEnabled] = useState(false)
  const [minStockLevel, setMinStockLevel] = useState('')
  const [reorderQty, setReorderQty] = useState('')
  const [initialQty, setInitialQty] = useState('')
  const [warehouseId, setWarehouseId] = useState('')
  const [locationId, setLocationId] = useState('')

  useEffect(() => {
    setPageTitle('New Product')
    setBreadcrumbs([
      { label: 'Products', href: '/products' },
      { label: 'New Product' },
    ])
  }, [setBreadcrumbs, setPageTitle])

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => productsApi.getCategories(),
  })

  const { data: warehouses = [] } = useQuery({
    queryKey: ['warehouses'],
    queryFn: () => warehouseApi.getAll(),
  })

  const { data: locations = [] } = useQuery({
    queryKey: ['warehouse-locations-create', warehouseId],
    queryFn: () => warehouseApi.getLocations(warehouseId),
    enabled: Boolean(warehouseId),
  })

  useEffect(() => {
    if (!warehouseId && warehouses[0]) {
      setWarehouseId(warehouses[0].id)
    }
  }, [warehouseId, warehouses])

  useEffect(() => {
    if (!locationId && locations[0]) {
      setLocationId(locations[0].id)
    }
  }, [locationId, locations])

  const canSubmit = useMemo(() => {
    if (!name.trim() || !sku.trim() || !uom.trim()) return false
    if ((Number(initialQty) || 0) > 0 && !locationId) return false
    return true
  }, [initialQty, locationId, name, sku, uom])

  const createMutation = useMutation({
    mutationFn: async () => {
      return productsApi.create({
        name: name.trim(),
        sku: sku.trim(),
        categoryId: categoryId || undefined,
        uom: uom.trim(),
        description: description.trim() || undefined,
        reorderEnabled,
        minStockLevel: minStockLevel ? Number(minStockLevel) : undefined,
        reorderQty: reorderQty ? Number(reorderQty) : undefined,
        initialQty: initialQty ? Number(initialQty) : undefined,
        locationId: initialQty ? locationId : undefined,
      })
    },
    onSuccess: (created) => {
      toast.success('Product created successfully')
      navigate(`/products/${created.id}`)
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to create product')
    },
  })

  return (
    <div className="space-y-6">
      <PageHeader title="New Product" />

      <Card>
        <CardHeader>
          <CardTitle>Create Product</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Product Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Steel" />
            </div>
            <div className="space-y-2">
              <Label>SKU</Label>
              <Input value={sku} onChange={(e) => setSku(e.target.value)} placeholder="STL-001" />
            </div>
            <div className="space-y-2">
              <Label>Unit of Measure</Label>
              <Input value={uom} onChange={(e) => setUom(e.target.value)} placeholder="kg" />
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">No category</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
            />
          </div>

          <div className="rounded-lg border border-slate-200 dark:border-slate-700 p-4 space-y-4">
            <div className="flex items-center justify-between">
              <Label>Enable Reorder Rules</Label>
              <Switch checked={reorderEnabled} onCheckedChange={setReorderEnabled} />
            </div>
            {reorderEnabled && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Minimum Stock</Label>
                  <Input type="number" min="0" value={minStockLevel} onChange={(e) => setMinStockLevel(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Reorder Quantity</Label>
                  <Input type="number" min="0" value={reorderQty} onChange={(e) => setReorderQty(e.target.value)} />
                </div>
              </div>
            )}
          </div>

          <div className="rounded-lg border border-slate-200 dark:border-slate-700 p-4 space-y-4">
            <h3 className="text-sm font-semibold">Initial Stock (Optional)</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Initial Quantity</Label>
                <Input type="number" min="0" step="0.01" value={initialQty} onChange={(e) => setInitialQty(e.target.value)} placeholder="100" />
              </div>
              <div className="space-y-2">
                <Label>Warehouse</Label>
                <select
                  value={warehouseId}
                  onChange={(e) => {
                    setWarehouseId(e.target.value)
                    setLocationId('')
                  }}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">Select warehouse</option>
                  {warehouses.map((wh) => (
                    <option key={wh.id} value={wh.id}>
                      {wh.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Location</Label>
                <select
                  value={locationId}
                  onChange={(e) => setLocationId(e.target.value)}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">Select location</option>
                  {locations.map((loc) => (
                    <option key={loc.id} value={loc.id}>
                      {loc.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => navigate('/products')}>
              Cancel
            </Button>
            <Button onClick={() => createMutation.mutate()} disabled={!canSubmit || createMutation.isPending}>
              {createMutation.isPending ? 'Creating...' : 'Create Product'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
