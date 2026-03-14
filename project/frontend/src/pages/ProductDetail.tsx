import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Pencil,
  SlidersHorizontal,
  PackageCheck,
  Truck,
  ArrowLeftRight,
  Zap,
  ArrowUpRight,
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { useUIStore } from '@/store'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { StockStatusBadge } from '@/components/shared/StatusBadge'
import { cn } from '@/lib/utils'
import type { StockLevel, MoveHistory } from '@/types'

const mockProduct = {
  id: '1', name: 'Steel Rods (10mm)', sku: 'SKU-00042', categoryName: 'Raw Materials', uom: 'kg',
  description: 'Standard 10mm diameter steel reinforcement rods for construction use.',
  onHand: 450, reserved: 50, available: 400, reorderEnabled: true, minStockLevel: 100, reorderQty: 200,
  stockStatus: 'in_stock' as const, createdByName: 'John Doe', createdAt: '2026-01-15T10:00:00Z', updatedAt: '2026-03-14T08:30:00Z',
}

const mockStockLevels: StockLevel[] = [
  { warehouseId: '1', warehouseName: 'Main Warehouse', locationId: '1', locationName: 'Rack A', onHand: 300, reserved: 30, available: 270, lastUpdated: '2026-03-14' },
  { warehouseId: '1', warehouseName: 'Main Warehouse', locationId: '2', locationName: 'Rack B', onHand: 100, reserved: 20, available: 80, lastUpdated: '2026-03-13' },
  { warehouseId: '2', warehouseName: 'North Branch', locationId: '3', locationName: 'Zone A', onHand: 50, reserved: 0, available: 50, lastUpdated: '2026-03-12' },
]

const mockMoves: MoveHistory[] = [
  { id: '1', operationId: '1', reference: 'RCP/2026/00012', type: 'receipt', productId: '1', productName: 'Steel Rods', productSku: 'SKU-00042', toWarehouse: 'Main Warehouse', toLocation: 'Rack A', qty: 50, uom: 'kg', direction: 'incoming', movedBy: '1', movedByName: 'John', movedAt: new Date(Date.now() - 3600000).toISOString() },
  { id: '2', operationId: '5', reference: 'DLV/2026/00005', type: 'delivery', productId: '1', productName: 'Steel Rods', productSku: 'SKU-00042', fromWarehouse: 'Main', fromLocation: 'Rack A', qty: -25, uom: 'kg', direction: 'outgoing', movedBy: '2', movedByName: 'Sarah', movedAt: new Date(Date.now() - 7200000).toISOString() },
  { id: '3', operationId: '3', reference: 'TRF/2026/00002', type: 'transfer', productId: '1', productName: 'Steel Rods', productSku: 'SKU-00042', fromWarehouse: 'Main', fromLocation: 'Rack B', toWarehouse: 'North', toLocation: 'Zone A', qty: 30, uom: 'kg', direction: 'internal', movedBy: '1', movedByName: 'John', movedAt: new Date(Date.now() - 86400000).toISOString() },
  { id: '4', operationId: '4', reference: 'ADJ/2026/00001', type: 'adjustment', productId: '1', productName: 'Steel Rods', productSku: 'SKU-00042', toWarehouse: 'Main', toLocation: 'Rack A', qty: -3, uom: 'kg', direction: 'adjustment', movedBy: '1', movedByName: 'John', movedAt: new Date(Date.now() - 172800000).toISOString() },
]

const typeIcons = { receipt: PackageCheck, delivery: Truck, transfer: ArrowLeftRight, adjustment: Zap }
const typeColors = { receipt: 'text-teal-600 bg-teal-50', delivery: 'text-indigo-600 bg-indigo-50', transfer: 'text-purple-600 bg-purple-50', adjustment: 'text-orange-600 bg-orange-50' }

export default function ProductDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { setPageTitle, setBreadcrumbs } = useUIStore()

  useEffect(() => {
    setPageTitle(mockProduct.name)
    setBreadcrumbs([
      { label: 'Products', href: '/products' },
      { label: mockProduct.name },
    ])
  }, [setPageTitle, setBreadcrumbs])

  const product = mockProduct
  const totalOnHand = mockStockLevels.reduce((s, l) => s + l.onHand, 0)

  return (
    <div className="space-y-6">
      {/* Top Section */}
      <div className="grid grid-cols-1 lg:grid-cols-10 gap-6">
        {/* Left — Product identity */}
        <div className="lg:col-span-7">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-2">{product.name}</h2>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="secondary" className="font-mono">{product.sku}</Badge>
                    <Badge variant="secondary">{product.categoryName}</Badge>
                    <Badge variant="secondary">{product.uom}</Badge>
                    <StockStatusBadge status={product.stockStatus} />
                  </div>
                </div>
              </div>
              {product.description && <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">{product.description}</p>}

              {/* Stock overview mini-bars */}
              <div className="space-y-3">
                <h3 className="text-section-heading text-slate-700 dark:text-slate-300">Stock by Warehouse</h3>
                {mockStockLevels.map((level) => {
                  const max = Math.max(...mockStockLevels.map(l => l.onHand)) * 1.2 || 1
                  return (
                    <div key={level.locationId} className="flex items-center gap-4">
                      <div className="w-36 text-sm text-slate-600 dark:text-slate-400 truncate">
                        {level.warehouseName}
                        <span className="text-slate-400 dark:text-slate-500"> / {level.locationName}</span>
                      </div>
                      <div className="flex-1 h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex">
                        <div className="bg-emerald-500 h-full rounded-l-full transition-all" style={{ width: `${(level.available / max) * 100}%` }} />
                        <div className="bg-amber-400 h-full transition-all" style={{ width: `${(level.reserved / max) * 100}%` }} />
                      </div>
                      <span className="text-xs font-mono text-slate-500 w-32 text-right">
                        {level.available} avail / {level.reserved} rsv
                      </span>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right — Actions + metadata */}
        <div className="lg:col-span-3">
          <Card>
            <CardContent className="p-6 space-y-4">
              <Button variant="outline" className="w-full gap-2" onClick={() => navigate(`/products/${id}/edit`)}>
                <Pencil className="w-4 h-4" /> Edit Product
              </Button>
              <Button variant="outline" className="w-full gap-2 text-amber-600 border-amber-300 hover:bg-amber-50">
                <SlidersHorizontal className="w-4 h-4" /> Record Adjustment
              </Button>
              <div className="border-t border-slate-200 dark:border-slate-700 pt-4 space-y-3 text-sm">
                <div className="flex justify-between"><span className="text-slate-500">Created by</span><span className="font-medium">{product.createdByName}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Created</span><span>{new Date(product.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Last updated</span><span>{formatDistanceToNow(new Date(product.updatedAt), { addSuffix: true })}</span></div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Reorder rule</span>
                  <span className={product.reorderEnabled ? 'text-emerald-600' : 'text-slate-400'}>
                    {product.reorderEnabled ? `Min ${product.minStockLevel}, Reorder ${product.reorderQty}` : 'Not set'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Stock Breakdown Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CardTitle>Stock by Location</CardTitle>
              <Badge variant="secondary" className="font-mono">{totalOnHand} total</Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700">
                <th className="text-left text-table-header uppercase text-slate-500 pb-3">Warehouse</th>
                <th className="text-left text-table-header uppercase text-slate-500 pb-3">Location</th>
                <th className="text-right text-table-header uppercase text-slate-500 pb-3">On Hand</th>
                <th className="text-right text-table-header uppercase text-slate-500 pb-3">Reserved</th>
                <th className="text-right text-table-header uppercase text-slate-500 pb-3">Available</th>
                <th className="text-right text-table-header uppercase text-slate-500 pb-3">Last Updated</th>
              </tr>
            </thead>
            <tbody>
              {mockStockLevels.map((level) => (
                <tr key={level.locationId} className="border-b border-slate-50 dark:border-slate-800/50 h-12">
                  <td className="text-sm text-slate-900 dark:text-white">{level.warehouseName}</td>
                  <td className="text-sm text-slate-600 dark:text-slate-400">{level.locationName}</td>
                  <td className="text-right font-mono font-bold text-sm">{level.onHand}</td>
                  <td className="text-right font-mono text-sm text-slate-500">{level.reserved}</td>
                  <td className="text-right font-mono text-sm text-emerald-600">{level.available}</td>
                  <td className="text-right text-sm text-slate-400">{level.lastUpdated}</td>
                </tr>
              ))}
              <tr className="font-bold border-t-2 border-slate-200 dark:border-slate-600">
                <td colSpan={2} className="text-sm pt-3">Total</td>
                <td className="text-right font-mono text-sm pt-3">{mockStockLevels.reduce((s, l) => s + l.onHand, 0)}</td>
                <td className="text-right font-mono text-sm pt-3 text-slate-500">{mockStockLevels.reduce((s, l) => s + l.reserved, 0)}</td>
                <td className="text-right font-mono text-sm pt-3 text-emerald-600">{mockStockLevels.reduce((s, l) => s + l.available, 0)}</td>
                <td></td>
              </tr>
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Move History */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Stock Movement History</CardTitle>
            <Button variant="outline" size="sm" className="gap-1.5">Export</Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {mockMoves.map((move) => {
              const Icon = typeIcons[move.type]
              const color = typeColors[move.type]
              return (
                <div key={move.id} className="flex items-start gap-4 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                  <div className={cn('w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0', color)}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm">
                      <button onClick={() => navigate(`/operations/receipts/${move.operationId}`)} className="font-mono text-indigo-600 hover:underline">
                        {move.reference}
                      </button>
                      <span className="text-slate-600 dark:text-slate-400"> — {move.productName}</span>
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {move.fromLocation && `From ${move.fromLocation}`}
                      {move.fromLocation && move.toLocation && ' → '}
                      {move.toLocation && `To ${move.toLocation}`}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className={cn('text-lg font-bold font-mono', move.qty > 0 ? 'text-emerald-600' : 'text-red-600')}>
                      {move.qty > 0 ? '+' : ''}{move.qty}
                    </span>
                    <p className="text-xs text-slate-400">{formatDistanceToNow(new Date(move.movedAt), { addSuffix: true })}</p>
                  </div>
                </div>
              )
            })}
          </div>
          <Button variant="outline" className="w-full mt-4">Load more</Button>
        </CardContent>
      </Card>
    </div>
  )
}
