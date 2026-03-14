import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus,
  Download,
  Upload,
  Search,
  X,
  MoreHorizontal,
  Eye,
  Pencil,
  Copy,
  Trash2,
  TrendingUp,
} from 'lucide-react'
import { useUIStore } from '@/store'
import { useDebounce } from '@/hooks'
import { PageHeader } from '@/components/shared/PageHeader'
import { StockStatusBadge } from '@/components/shared/StatusBadge'
import { EmptyState } from '@/components/shared/EmptyState'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { SkeletonTable } from '@/components/shared/Skeleton'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import type { Product } from '@/types'

// Mock data
const mockProducts: Product[] = [
  { id: '1', name: 'Steel Rods (10mm)', sku: 'SKU-00042', categoryId: '1', categoryName: 'Raw Materials', uom: 'kg', onHand: 450, reserved: 50, available: 400, reorderEnabled: true, minStockLevel: 100, reorderQty: 200, stockStatus: 'in_stock', createdBy: '1', createdByName: 'John', createdAt: '2026-01-15', updatedAt: '2026-03-14' },
  { id: '2', name: 'Copper Wire (2.5mm)', sku: 'SKU-00087', categoryId: '1', categoryName: 'Raw Materials', uom: 'metre', onHand: 15, reserved: 5, available: 10, reorderEnabled: true, minStockLevel: 30, reorderQty: 100, stockStatus: 'low_stock', createdBy: '1', createdByName: 'John', createdAt: '2026-01-20', updatedAt: '2026-03-13' },
  { id: '3', name: 'PVC Pipe (4")', sku: 'SKU-00123', categoryId: '2', categoryName: 'Plumbing', uom: 'pcs', onHand: 0, reserved: 0, available: 0, reorderEnabled: true, minStockLevel: 25, reorderQty: 50, stockStatus: 'out_of_stock', createdBy: '2', createdByName: 'Sarah', createdAt: '2026-02-01', updatedAt: '2026-03-12' },
  { id: '4', name: 'Cement (50kg bags)', sku: 'SKU-00015', categoryId: '3', categoryName: 'Construction', uom: 'pcs', onHand: 180, reserved: 20, available: 160, reorderEnabled: false, stockStatus: 'in_stock', createdBy: '1', createdByName: 'John', createdAt: '2026-01-10', updatedAt: '2026-03-14' },
  { id: '5', name: 'Paint - White (20L)', sku: 'SKU-00201', categoryId: '4', categoryName: 'Finishing', uom: 'litre', onHand: 45, reserved: 0, available: 45, reorderEnabled: true, minStockLevel: 20, reorderQty: 40, stockStatus: 'in_stock', createdBy: '2', createdByName: 'Sarah', createdAt: '2026-02-15', updatedAt: '2026-03-10' },
  { id: '6', name: 'Aluminum Sheet (1mm)', sku: 'SKU-00067', categoryId: '1', categoryName: 'Raw Materials', uom: 'pcs', onHand: 8, reserved: 3, available: 5, reorderEnabled: true, minStockLevel: 15, reorderQty: 30, stockStatus: 'low_stock', createdBy: '1', createdByName: 'John', createdAt: '2026-01-25', updatedAt: '2026-03-11' },
  { id: '7', name: 'Wire Nails (2")', sku: 'SKU-00145', categoryId: '5', categoryName: 'Hardware', uom: 'kg', onHand: 75, reserved: 10, available: 65, reorderEnabled: false, stockStatus: 'in_stock', createdBy: '2', createdByName: 'Sarah', createdAt: '2026-02-10', updatedAt: '2026-03-09' },
  { id: '8', name: 'Plywood Board (12mm)', sku: 'SKU-00098', categoryId: '6', categoryName: 'Wood', uom: 'pcs', onHand: 0, reserved: 0, available: 0, reorderEnabled: true, minStockLevel: 10, reorderQty: 20, stockStatus: 'out_of_stock', createdBy: '1', createdByName: 'John', createdAt: '2026-02-20', updatedAt: '2026-03-08' },
]

export default function ProductList() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { setPageTitle, setBreadcrumbs } = useUIStore()

  const [searchValue, setSearchValue] = useState(searchParams.get('search') || '')
  const debouncedSearch = useDebounce(searchValue, 300)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null)

  useEffect(() => {
    setPageTitle('Products')
    setBreadcrumbs([])
  }, [setPageTitle, setBreadcrumbs])

  // Filter products based on search params
  const stockStatusFilter = searchParams.get('stockStatus')
  const filteredProducts = mockProducts.filter((p) => {
    if (debouncedSearch && !p.name.toLowerCase().includes(debouncedSearch.toLowerCase()) && !p.sku.toLowerCase().includes(debouncedSearch.toLowerCase())) return false
    if (stockStatusFilter && p.stockStatus !== stockStatusFilter) return false
    return true
  })

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredProducts.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filteredProducts.map((p) => p.id)))
    }
  }

  const clearFilters = () => {
    setSearchValue('')
    setSearchParams({})
  }

  const hasActiveFilters = !!debouncedSearch || !!stockStatusFilter

  return (
    <div className="space-y-6">
      <PageHeader title="Products" count={filteredProducts.length}>
        <Button variant="outline" className="gap-2">
          <Download className="w-4 h-4" /> Export CSV
        </Button>
        <Button className="gap-2" onClick={() => navigate('/products/new')}>
          <Plus className="w-4 h-4" /> New Product
        </Button>
      </PageHeader>

      {/* Filter Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search by name or SKU..."
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Stock status filter chips */}
            <div className="flex gap-2">
              {[
                { value: '', label: 'All' },
                { value: 'in_stock', label: 'In Stock' },
                { value: 'low_stock', label: 'Low Stock' },
                { value: 'out_of_stock', label: 'Out of Stock' },
              ].map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => {
                    if (opt.value) {
                      setSearchParams({ stockStatus: opt.value })
                    } else {
                      searchParams.delete('stockStatus')
                      setSearchParams(searchParams)
                    }
                  }}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                    (stockStatusFilter === opt.value || (!stockStatusFilter && !opt.value))
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1"
              >
                <X className="w-3.5 h-3.5" /> Clear all
              </button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Bulk Action Bar */}
      <AnimatePresence>
        {selectedIds.size > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <Card className="border-indigo-200 bg-indigo-50/50 dark:bg-indigo-900/10 dark:border-indigo-800">
              <CardContent className="p-3 flex items-center gap-3">
                <span className="text-sm font-medium text-indigo-700 dark:text-indigo-300">
                  {selectedIds.size} products selected
                </span>
                <Button variant="outline" size="sm" className="gap-1.5">
                  <Download className="w-3.5 h-3.5" /> Export CSV
                </Button>
                <Button variant="destructive" size="sm" className="gap-1.5">
                  <Trash2 className="w-3.5 h-3.5" /> Delete selected
                </Button>
                <button
                  onClick={() => setSelectedIds(new Set())}
                  className="ml-auto text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Products Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700">
                <th className="text-left p-4 w-10">
                  <input
                    type="checkbox"
                    checked={selectedIds.size === filteredProducts.length && filteredProducts.length > 0}
                    onChange={toggleSelectAll}
                    className="rounded border-slate-300"
                  />
                </th>
                <th className="text-left text-table-header uppercase text-slate-500 p-4">Product</th>
                <th className="text-left text-table-header uppercase text-slate-500 p-4">Category</th>
                <th className="text-center text-table-header uppercase text-slate-500 p-4">UOM</th>
                <th className="text-right text-table-header uppercase text-slate-500 p-4">On Hand</th>
                <th className="text-right text-table-header uppercase text-slate-500 p-4">Reserved</th>
                <th className="text-right text-table-header uppercase text-slate-500 p-4">Available</th>
                <th className="text-left text-table-header uppercase text-slate-500 p-4">Status</th>
                <th className="text-right text-table-header uppercase text-slate-500 p-4 w-10"></th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product, i) => (
                <motion.tr
                  key={product.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.03 }}
                  className={cn(
                    'border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors h-14',
                    product.stockStatus === 'low_stock' && 'bg-amber-50/50 dark:bg-amber-900/5 border-l-4 border-l-amber-300',
                    product.stockStatus === 'out_of_stock' && 'bg-red-50/50 dark:bg-red-900/5 border-l-4 border-l-red-400'
                  )}
                  onClick={() => navigate(`/products/${product.id}`)}
                >
                  <td className="p-4" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selectedIds.has(product.id)}
                      onChange={() => toggleSelect(product.id)}
                      className="rounded border-slate-300"
                    />
                  </td>
                  <td className="p-4">
                    <div>
                      <span className="text-sm font-semibold text-slate-900 dark:text-white">{product.name}</span>
                      <p className="text-xs font-mono text-slate-400 mt-0.5">{product.sku}</p>
                    </div>
                  </td>
                  <td className="p-4 text-sm text-slate-600 dark:text-slate-400">{product.categoryName}</td>
                  <td className="p-4 text-sm text-slate-600 dark:text-slate-400 text-center">{product.uom}</td>
                  <td className="p-4 text-right font-mono font-bold text-sm text-slate-900 dark:text-white">{product.onHand}</td>
                  <td className="p-4 text-right font-mono text-sm text-slate-500">{product.reserved}</td>
                  <td className={cn(
                    'p-4 text-right font-mono text-sm font-medium',
                    product.available === 0 ? 'text-red-600' : product.stockStatus === 'low_stock' ? 'text-amber-600' : 'text-emerald-600'
                  )}>
                    {product.available}
                  </td>
                  <td className="p-4"><StockStatusBadge status={product.stockStatus} /></td>
                  <td className="p-4 text-right" onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => navigate(`/products/${product.id}`)}>
                          <Eye className="w-4 h-4 mr-2" /> View Detail
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Pencil className="w-4 h-4 mr-2" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Copy className="w-4 h-4 mr-2" /> Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-red-600"
                          onClick={() => {
                            setDeleteTargetId(product.id)
                            setDeleteDialogOpen(true)
                          }}
                        >
                          <Trash2 className="w-4 h-4 mr-2" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
          {filteredProducts.length === 0 && (
            <EmptyState
              title="No products found"
              description={hasActiveFilters ? 'Try adjusting your filters' : 'Create your first product to get started'}
              actionLabel={hasActiveFilters ? 'Clear filters' : 'New Product'}
              onAction={hasActiveFilters ? clearFilters : () => navigate('/products/new')}
            />
          )}
        </div>

        {/* Pagination */}
        {filteredProducts.length > 0 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 dark:border-slate-700">
            <span className="text-sm text-slate-500">
              Showing 1–{filteredProducts.length} of {filteredProducts.length} results
            </span>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="sm" disabled>Previous</Button>
              <Button variant="outline" size="sm" className="bg-indigo-600 text-white border-indigo-600">1</Button>
              <Button variant="outline" size="sm" disabled>Next</Button>
            </div>
          </div>
        )}
      </Card>

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Product"
        description="Are you sure you want to delete this product? This action cannot be undone."
        variant="danger"
        confirmLabel="Delete"
        onConfirm={() => {
          setDeleteDialogOpen(false)
          setDeleteTargetId(null)
        }}
      />
    </div>
  )
}
