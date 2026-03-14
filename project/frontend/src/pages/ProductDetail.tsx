import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeftRight, PackageCheck, Pencil, SlidersHorizontal, Truck, Zap } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { formatDistanceToNow } from 'date-fns'

import { movesApi } from '@/api/moves'
import { productsApi } from '@/api/products'
import { useUIStore } from '@/store'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/shared/EmptyState'
import { StockStatusBadge } from '@/components/shared/StatusBadge'
import { cn } from '@/lib/utils'

const typeIcons = { receipt: PackageCheck, delivery: Truck, transfer: ArrowLeftRight, adjustment: Zap }
const typeColors = {
  receipt: 'text-teal-600 bg-teal-50',
  delivery: 'text-indigo-600 bg-indigo-50',
  transfer: 'text-purple-600 bg-purple-50',
  adjustment: 'text-orange-600 bg-orange-50',
}

export default function ProductDetail() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const { setPageTitle, setBreadcrumbs } = useUIStore()

  const { data: product, isLoading: productLoading } = useQuery({
    queryKey: ['product', id],
    queryFn: () => productsApi.getById(id),
    enabled: Boolean(id),
  })

  const { data: stockLevels = [] } = useQuery({
    queryKey: ['product-stock-levels', id],
    queryFn: () => productsApi.getStockLevels(id),
    enabled: Boolean(id),
  })

  const { data: moves = [] } = useQuery({
    queryKey: ['product-moves', id],
    queryFn: () => movesApi.getByProduct(id, 1, 8),
    enabled: Boolean(id),
    select: (result) => result.data,
  })

  useEffect(() => {
    if (!product) return
    setPageTitle(product.name)
    setBreadcrumbs([
      { label: 'Products', href: '/products' },
      { label: product.name },
    ])
  }, [product, setBreadcrumbs, setPageTitle])

  if (productLoading) {
    return <div className="text-sm text-slate-500">Loading product...</div>
  }

  if (!product) {
    return <EmptyState title="Product not found" description="The selected product was not found." />
  }

  const maxOnHand = Math.max(...stockLevels.map((level) => level.onHand), 1)

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-10 gap-6">
        <div className="lg:col-span-7">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-2">{product.name}</h2>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="secondary" className="font-mono">
                      {product.sku}
                    </Badge>
                    <Badge variant="secondary">{product.categoryName}</Badge>
                    <Badge variant="secondary">{product.uom}</Badge>
                    <StockStatusBadge status={product.stockStatus} />
                  </div>
                </div>
              </div>
              {product.description && <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">{product.description}</p>}

              <div className="space-y-3">
                <h3 className="text-section-heading text-slate-700 dark:text-slate-300">Stock by Warehouse</h3>
                {stockLevels.map((level) => (
                  <div key={level.locationId} className="flex items-center gap-4">
                    <div className="w-36 text-sm text-slate-600 dark:text-slate-400 truncate">
                      {level.warehouseName}
                      <span className="text-slate-400 dark:text-slate-500"> / {level.locationName}</span>
                    </div>
                    <div className="flex-1 h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex">
                      <div className="bg-emerald-500 h-full rounded-l-full transition-all" style={{ width: `${(level.available / (maxOnHand * 1.2)) * 100}%` }} />
                      <div className="bg-amber-400 h-full transition-all" style={{ width: `${(level.reserved / (maxOnHand * 1.2)) * 100}%` }} />
                    </div>
                    <span className="text-xs font-mono text-slate-500 w-32 text-right">
                      {level.available} avail / {level.reserved} rsv
                    </span>
                  </div>
                ))}
                {stockLevels.length === 0 && <p className="text-sm text-slate-400">No stock levels recorded.</p>}
              </div>
            </CardContent>
          </Card>
        </div>

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
                <div className="flex justify-between">
                  <span className="text-slate-500">Created</span>
                  <span>{new Date(product.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Last updated</span>
                  <span>{formatDistanceToNow(new Date(product.updatedAt), { addSuffix: true })}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Reorder rule</span>
                  <span className={product.reorderEnabled ? 'text-emerald-600' : 'text-slate-400'}>
                    {product.reorderEnabled ? `Min ${product.minStockLevel ?? 0}, Reorder ${product.reorderQty ?? 0}` : 'Not set'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CardTitle>Stock by Location</CardTitle>
              <Badge variant="secondary" className="font-mono">
                {product.onHand} total
              </Badge>
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
              {stockLevels.map((level) => (
                <tr key={level.locationId} className="border-b border-slate-50 dark:border-slate-800/50 h-12">
                  <td className="text-sm text-slate-900 dark:text-white">{level.warehouseName}</td>
                  <td className="text-sm text-slate-600 dark:text-slate-400">{level.locationName}</td>
                  <td className="text-right font-mono font-bold text-sm">{level.onHand}</td>
                  <td className="text-right font-mono text-sm text-slate-500">{level.reserved}</td>
                  <td className="text-right font-mono text-sm text-emerald-600">{level.available}</td>
                  <td className="text-right text-sm text-slate-400">{new Date(level.lastUpdated).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {stockLevels.length === 0 && <EmptyState title="No stock records" description="Stock levels will appear after movement operations." />}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Stock Movement History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {moves.map((move) => {
              const Icon = typeIcons[move.type]
              const color = typeColors[move.type]

              return (
                <div key={move.id} className="flex items-start gap-4 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                  <div className={cn('w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0', color)}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm">
                      <button onClick={() => navigate(`/operations/${move.type}s/${move.operationId}`)} className="font-mono text-indigo-600 hover:underline">
                        {move.reference || 'N/A'}
                      </button>
                      <span className="text-slate-600 dark:text-slate-400"> - {move.productName}</span>
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {move.fromLocation && `From ${move.fromLocation}`}
                      {move.fromLocation && move.toLocation && ' -> '}
                      {move.toLocation && `To ${move.toLocation}`}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className={cn('text-lg font-bold font-mono', move.qty > 0 ? 'text-emerald-600' : 'text-red-600')}>
                      {move.qty > 0 ? '+' : ''}
                      {move.qty}
                    </span>
                    <p className="text-xs text-slate-400">{formatDistanceToNow(new Date(move.movedAt), { addSuffix: true })}</p>
                  </div>
                </div>
              )
            })}
          </div>
          {moves.length === 0 && <EmptyState title="No move history" description="Movements for this product will appear here." />}
        </CardContent>
      </Card>
    </div>
  )
}
