import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Download, Plus, Search, Trash2 } from 'lucide-react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'

import { productsApi } from '@/api/products'
import { useDebounce } from '@/hooks'
import { useUIStore } from '@/store'
import { PageHeader } from '@/components/shared/PageHeader'
import { StockStatusBadge } from '@/components/shared/StatusBadge'
import { EmptyState } from '@/components/shared/EmptyState'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

export default function ProductList() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [searchParams, setSearchParams] = useSearchParams()
  const { setPageTitle, setBreadcrumbs } = useUIStore()

  const [searchValue, setSearchValue] = useState(searchParams.get('search') || '')
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const debouncedSearch = useDebounce(searchValue, 300)
  const stockStatus = searchParams.get('stockStatus') || undefined

  useEffect(() => {
    setPageTitle('Products')
    setBreadcrumbs([])
  }, [setBreadcrumbs, setPageTitle])

  const filters = useMemo(
    () => ({
      search: debouncedSearch || undefined,
      stockStatus,
      page: Number(searchParams.get('page') || 1),
      limit: 20,
      sortBy: 'name' as const,
      sortDir: 'asc' as const,
    }),
    [debouncedSearch, searchParams, stockStatus]
  )

  const { data, isLoading } = useQuery({
    queryKey: ['products', filters],
    queryFn: () => productsApi.getAll(filters),
  })

  const products = data?.data || []

  const handleExport = async () => {
    const blob = await productsApi.exportCsv(filters)
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'products-export.csv'
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url)
  }

  const handleDelete = async () => {
    if (!deleteTargetId) return
    setDeleting(true)
    try {
      await productsApi.delete(deleteTargetId)
      await queryClient.invalidateQueries({ queryKey: ['products'] })
      toast.success('Product deleted')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete product')
    } finally {
      setDeleting(false)
      setDeleteTargetId(null)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Products" count={products.length}>
        <Button variant="outline" className="gap-2" onClick={handleExport}>
          <Download className="w-4 h-4" /> Export CSV
        </Button>
        <Button className="gap-2" onClick={() => navigate('/products/new')}>
          <Plus className="w-4 h-4" /> New Product
        </Button>
      </PageHeader>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search by name or SKU..."
                value={searchValue}
                onChange={(e) => {
                  setSearchValue(e.target.value)
                  if (e.target.value) {
                    setSearchParams({ ...Object.fromEntries(searchParams.entries()), search: e.target.value })
                  }
                }}
                className="pl-10"
              />
            </div>

            <div className="flex gap-2">
              {[
                { key: '', label: 'All' },
                { key: 'in_stock', label: 'In Stock' },
                { key: 'low_stock', label: 'Low Stock' },
                { key: 'out_of_stock', label: 'Out of Stock' },
              ].map((item) => (
                <button
                  key={item.key}
                  onClick={() => {
                    const next = new URLSearchParams(searchParams)
                    if (item.key) next.set('stockStatus', item.key)
                    else next.delete('stockStatus')
                    setSearchParams(next)
                  }}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                    (stockStatus || '') === item.key
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
                  )}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700">
                <th className="text-left text-table-header uppercase text-slate-500 p-4">Product</th>
                <th className="text-left text-table-header uppercase text-slate-500 p-4">Category</th>
                <th className="text-center text-table-header uppercase text-slate-500 p-4">UOM</th>
                <th className="text-right text-table-header uppercase text-slate-500 p-4">On Hand</th>
                <th className="text-right text-table-header uppercase text-slate-500 p-4">Reserved</th>
                <th className="text-right text-table-header uppercase text-slate-500 p-4">Available</th>
                <th className="text-left text-table-header uppercase text-slate-500 p-4">Status</th>
                <th className="text-right text-table-header uppercase text-slate-500 p-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id} className="border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors h-14">
                  <td className="p-4 cursor-pointer" onClick={() => navigate(`/products/${product.id}`)}>
                    <div>
                      <span className="text-sm font-semibold text-slate-900 dark:text-white">{product.name}</span>
                      <p className="text-xs font-mono text-slate-400 mt-0.5">{product.sku}</p>
                    </div>
                  </td>
                  <td className="p-4 text-sm text-slate-600 dark:text-slate-400">{product.categoryName}</td>
                  <td className="p-4 text-sm text-slate-600 dark:text-slate-400 text-center">{product.uom}</td>
                  <td className="p-4 text-right font-mono text-sm">{product.onHand}</td>
                  <td className="p-4 text-right font-mono text-sm">{product.reserved}</td>
                  <td className="p-4 text-right font-mono text-sm">{product.available}</td>
                  <td className="p-4"><StockStatusBadge status={product.stockStatus} /></td>
                  <td className="p-4 text-right">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600" onClick={() => setDeleteTargetId(product.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {!isLoading && products.length === 0 && (
            <EmptyState title="No products found" description="Create your first product to get started" actionLabel="New Product" onAction={() => navigate('/products/new')} />
          )}
        </div>
      </Card>

      <ConfirmDialog
        open={Boolean(deleteTargetId)}
        onOpenChange={(open) => {
          if (!open) setDeleteTargetId(null)
        }}
        title="Delete Product"
        description="Are you sure you want to delete this product?"
        variant="danger"
        confirmLabel={deleting ? 'Deleting...' : 'Delete'}
        onConfirm={handleDelete}
      />
    </div>
  )
}
