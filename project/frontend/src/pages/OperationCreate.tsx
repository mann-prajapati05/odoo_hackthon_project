import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery } from '@tanstack/react-query'
import toast from 'react-hot-toast'

import { operationsApi } from '@/api/operations'
import { productsApi } from '@/api/products'
import { warehouseApi } from '@/api/warehouse'
import { useUIStore } from '@/store'
import { PageHeader } from '@/components/shared/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { OperationType } from '@/types'

interface OperationCreateProps {
  type: OperationType
  title: string
  listRoute: string
}

export default function OperationCreate({ type, title, listRoute }: OperationCreateProps) {
  const navigate = useNavigate()
  const { setPageTitle, setBreadcrumbs } = useUIStore()

  const [warehouseId, setWarehouseId] = useState('')
  const [productId, setProductId] = useState('')
  const [qty, setQty] = useState('')
  const [sourceLocationId, setSourceLocationId] = useState('')
  const [targetLocationId, setTargetLocationId] = useState('')
  const [supplierName, setSupplierName] = useState('')
  const [destinationName, setDestinationName] = useState('')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    setPageTitle(`New ${title.slice(0, -1)}`)
    setBreadcrumbs([
      { label: title, href: listRoute },
      { label: `New ${title.slice(0, -1)}` },
    ])
  }, [listRoute, setBreadcrumbs, setPageTitle, title])

  const { data: warehouses = [] } = useQuery({
    queryKey: ['warehouses-create-op'],
    queryFn: () => warehouseApi.getAll(),
  })

  const { data: locations = [] } = useQuery({
    queryKey: ['warehouse-locations-create-op', warehouseId],
    queryFn: () => warehouseApi.getLocations(warehouseId),
    enabled: Boolean(warehouseId),
  })

  const { data: warehouseProductsPage } = useQuery({
    queryKey: ['products-for-op-create', warehouseId],
    queryFn: () => productsApi.getAll({ page: 1, limit: 100, warehouseId }),
    enabled: Boolean(warehouseId),
  })

  const { data: allProductsPage } = useQuery({
    queryKey: ['products-for-op-create-all'],
    queryFn: () => productsApi.getAll({ page: 1, limit: 100 }),
  })

  const warehouseProducts = warehouseProductsPage?.data || []
  const allProducts = allProductsPage?.data || []
  const products = warehouseProducts.length > 0 ? warehouseProducts : allProducts

  useEffect(() => {
    if (!warehouseId && warehouses[0]) {
      setWarehouseId(warehouses[0].id)
    }
  }, [warehouseId, warehouses])

  useEffect(() => {
    if (!productId && products[0]) {
      setProductId(products[0].id)
    }
  }, [productId, products])

  useEffect(() => {
    if (!sourceLocationId && locations[0]) {
      setSourceLocationId(locations[0].id)
    }
    if (!targetLocationId && locations[0]) {
      setTargetLocationId(locations[0].id)
    }
  }, [locations, sourceLocationId, targetLocationId])

  const selectedProduct = products.find((p) => p.id === productId)

  const canSubmit = useMemo(() => {
    const n = Number(qty)
    if (!warehouseId || !productId || !Number.isFinite(n)) return false
    if (type === 'adjustment') {
      if (n < 0) return false
    } else if (n <= 0) {
      return false
    }
    if (type === 'delivery' && !sourceLocationId) return false
    if (type === 'transfer' && (!sourceLocationId || !targetLocationId || sourceLocationId === targetLocationId)) return false
    if (type === 'receipt' && !targetLocationId) return false
    if (type === 'adjustment' && !sourceLocationId) return false
    return true
  }, [productId, qty, sourceLocationId, targetLocationId, type, warehouseId])

  const buildPayload = async () => {
    const quantity = Number(qty)

    if (type === 'adjustment') {
      const physicalQty = Math.max(quantity, 0)

      return {
        type,
        warehouseId,
        notes: notes || 'Stock count adjustment',
        status: 'ready' as const,
        lines: [
          {
            productId,
            // Adjustment writes an absolute physical quantity; expectedQty is kept minimal for schema compatibility.
            expectedQty: 1,
            locationId: sourceLocationId,
            physicalQty,
            reason: 'cycle_count',
          },
        ],
      }
    }

    return {
      type,
      warehouseId,
      supplierName: type === 'receipt' ? supplierName || 'Vendor' : undefined,
      destinationName: type === 'delivery' ? destinationName || 'Customer' : undefined,
      fromLocationId: type === 'delivery' || type === 'transfer' ? sourceLocationId : undefined,
      toLocationId: type === 'transfer' ? targetLocationId : undefined,
      notes: notes || undefined,
      status: 'ready' as const,
      lines: [
        {
          productId,
          expectedQty: quantity,
          doneQty: quantity,
          locationId:
            type === 'receipt'
              ? targetLocationId
              : type === 'delivery'
                ? sourceLocationId
                : undefined,
        },
      ],
    }
  }

  const createMutation = useMutation({
    mutationFn: async () => {
      const payload = await buildPayload()
      return operationsApi.create(payload)
    },
    onSuccess: (created) => {
      toast.success(`${title.slice(0, -1)} created`)
      const routeMap: Record<OperationType, string> = {
        receipt: 'receipts',
        delivery: 'deliveries',
        transfer: 'transfers',
        adjustment: 'adjustments',
      }
      navigate(`/operations/${routeMap[type]}/${created.id}`)
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : `Failed to create ${title.slice(0, -1).toLowerCase()}`)
    },
  })

  const createAndValidateMutation = useMutation({
    mutationFn: async () => {
      const payload = await buildPayload()
      const created = await operationsApi.create(payload)
      await operationsApi.validate(created.id)
      return created
    },
    onSuccess: () => {
      toast.success(`${title.slice(0, -1)} created and validated`)
      navigate(listRoute)
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : `Failed to create/validate ${title.slice(0, -1).toLowerCase()}`)
    },
  })

  return (
    <div className="space-y-6">
      <PageHeader title={`New ${title.slice(0, -1)}`} />

      <Card>
        <CardHeader>
          <CardTitle>{title.slice(0, -1)} Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Warehouse</Label>
              <select
                value={warehouseId}
                onChange={(e) => {
                  setWarehouseId(e.target.value)
                  setProductId('')
                  setSourceLocationId('')
                  setTargetLocationId('')
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
              <Label>Product</Label>
              <select
                value={productId}
                onChange={(e) => setProductId(e.target.value)}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">Select product</option>
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name} ({product.sku})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label>{type === 'adjustment' ? 'New Physical Quantity' : 'Quantity'} {selectedProduct ? `(${selectedProduct.uom})` : ''}</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={qty}
                onChange={(e) => setQty(e.target.value)}
                placeholder={type === 'adjustment' ? 'Set exact stock, e.g. 77' : '100'}
              />
            </div>

            {(type === 'delivery' || type === 'transfer' || type === 'adjustment') && (
              <div className="space-y-2">
                <Label>{type === 'adjustment' ? 'Adjustment Location' : 'Source Location'}</Label>
                <select
                  value={sourceLocationId}
                  onChange={(e) => setSourceLocationId(e.target.value)}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">Select source location</option>
                  {locations.map((loc) => (
                    <option key={loc.id} value={loc.id}>
                      {loc.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {(type === 'receipt' || type === 'transfer') && (
              <div className="space-y-2">
                <Label>{type === 'receipt' ? 'Destination Location' : 'Target Location'}</Label>
                <select
                  value={targetLocationId}
                  onChange={(e) => setTargetLocationId(e.target.value)}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">Select destination location</option>
                  {locations.map((loc) => (
                    <option key={loc.id} value={loc.id}>
                      {loc.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {type === 'receipt' && (
              <div className="space-y-2">
                <Label>Vendor</Label>
                <Input value={supplierName} onChange={(e) => setSupplierName(e.target.value)} placeholder="Steel Vendor Ltd" />
              </div>
            )}

            {type === 'delivery' && (
              <div className="space-y-2">
                <Label>Customer / Destination</Label>
                <Input value={destinationName} onChange={(e) => setDestinationName(e.target.value)} placeholder="Production / Customer" />
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label>Notes</Label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
              placeholder={
                type === 'adjustment'
                  ? 'Example: 3 kg steel damaged'
                  : `Notes for this ${title.slice(0, -1).toLowerCase()}`
              }
            />
          </div>

          <div className="text-xs text-slate-500 rounded-lg bg-slate-50 dark:bg-slate-900/40 p-3 border border-slate-200 dark:border-slate-700">
            {type === 'receipt' && 'This creates a READY receipt. Validate it to increase stock and log the stock move.'}
            {type === 'transfer' && 'This creates a READY transfer from source to destination location. Validate it to move stock internally.'}
            {type === 'delivery' && 'This creates a READY delivery from source location. Validate it to reduce stock and create ledger entry.'}
            {type === 'adjustment' && 'This creates a READY stock rewrite. The value entered is the exact final stock for the selected product/location after validation.'}
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => navigate(listRoute)}>
              Cancel
            </Button>
            <Button onClick={() => createMutation.mutate()} disabled={!canSubmit || createMutation.isPending || createAndValidateMutation.isPending}>
              {createMutation.isPending ? 'Creating...' : 'Create'}
            </Button>
            <Button
              variant="success"
              onClick={() => createAndValidateMutation.mutate()}
              disabled={!canSubmit || createMutation.isPending || createAndValidateMutation.isPending}
            >
              {createAndValidateMutation.isPending ? 'Processing...' : 'Create & Validate'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
