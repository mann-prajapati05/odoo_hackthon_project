import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Download, Search, X, PackageCheck, Truck, ArrowLeftRight, Zap } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { useUIStore } from '@/store'
import { useDebounce } from '@/hooks'
import { PageHeader } from '@/components/shared/PageHeader'
import { EmptyState } from '@/components/shared/EmptyState'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import type { MoveHistory as MoveHistoryType } from '@/types'

const typeIcons = { receipt: PackageCheck, delivery: Truck, transfer: ArrowLeftRight, adjustment: Zap }
const typeColors = { receipt: 'text-teal-600 bg-teal-50', delivery: 'text-indigo-600 bg-indigo-50', transfer: 'text-purple-600 bg-purple-50', adjustment: 'text-orange-600 bg-orange-50' }

const MOVE_TYPES = ['receipt', 'delivery', 'transfer', 'adjustment'] as const
const PRODUCT_NAMES = ['Steel Rods', 'Copper Wire', 'PVC Pipe', 'Cement', 'Plywood']
const PRODUCT_UOMS = ['kg', 'metre', 'pcs', 'pcs', 'pcs']
const DIRECTIONS = ['incoming', 'outgoing', 'internal', 'adjustment'] as const

const mockMoveHistory = Array.from({ length: 20 }, (_, i) => ({
  id: String(i + 1), operationId: String(i + 1), reference: `${['RCP', 'DLV', 'TRF', 'ADJ'][i % 4]}/2026/${String(i + 1).padStart(5, '0')}`,
  type: MOVE_TYPES[i % 4]!,
  productId: String((i % 5) + 1), productName: PRODUCT_NAMES[i % 5]!, productSku: `SKU-${String(40 + i).padStart(5, '0')}`,
  fromWarehouse: i % 4 !== 0 ? 'Main Warehouse' : undefined, fromLocation: i % 4 !== 0 ? 'Rack A' : undefined,
  toWarehouse: i % 4 !== 1 ? 'Main Warehouse' : undefined, toLocation: i % 4 !== 1 ? 'Rack B' : undefined,
  qty: i % 4 === 1 ? -(10 + i * 2) : (10 + i * 3), uom: PRODUCT_UOMS[i % 5]!,
  direction: DIRECTIONS[i % 4]!,
  movedBy: '1', movedByName: i % 2 === 0 ? 'John Doe' : 'Sarah Kim', movedAt: new Date(Date.now() - i * 3600000 * 3).toISOString(),
})) satisfies MoveHistoryType[]

export default function MoveHistoryPage() {
  const { setPageTitle, setBreadcrumbs } = useUIStore()
  const [searchValue, setSearchValue] = useState('')
  const debouncedSearch = useDebounce(searchValue, 300)
  const [typeFilter, setTypeFilter] = useState<string>('')

  useEffect(() => {
    setPageTitle('Move History')
    setBreadcrumbs([])
  }, [setPageTitle, setBreadcrumbs])

  const filtered = mockMoveHistory.filter((m) => {
    if (typeFilter && m.type !== typeFilter) return false
    if (debouncedSearch && !m.productName.toLowerCase().includes(debouncedSearch.toLowerCase()) && !m.reference.toLowerCase().includes(debouncedSearch.toLowerCase())) return false
    return true
  })

  return (
    <div className="space-y-6">
      <PageHeader title="Move History" count={filtered.length}>
        <Button variant="outline" className="gap-2"><Download className="w-4 h-4" /> Export CSV</Button>
      </PageHeader>

      {/* Filters */}
      <Card>
        <CardContent className="p-4 flex flex-wrap items-center gap-3">
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input placeholder="Search product or reference..." value={searchValue} onChange={(e) => setSearchValue(e.target.value)} className="pl-10" />
          </div>
          <div className="flex gap-2">
            {[{ key: '', label: 'All' }, { key: 'receipt', label: 'Receipts' }, { key: 'delivery', label: 'Deliveries' }, { key: 'transfer', label: 'Transfers' }, { key: 'adjustment', label: 'Adjustments' }].map((t) => (
              <button key={t.key} onClick={() => setTypeFilter(t.key)} className={cn('px-3 py-1.5 rounded-lg text-xs font-medium transition-colors', typeFilter === t.key ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300')}>
                {t.label}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700">
                <th className="text-left text-table-header uppercase text-slate-500 p-4 w-8"></th>
                <th className="text-left text-table-header uppercase text-slate-500 p-4">Reference</th>
                <th className="text-left text-table-header uppercase text-slate-500 p-4">Product</th>
                <th className="text-left text-table-header uppercase text-slate-500 p-4">From → To</th>
                <th className="text-right text-table-header uppercase text-slate-500 p-4">Quantity</th>
                <th className="text-left text-table-header uppercase text-slate-500 p-4">Moved By</th>
                <th className="text-left text-table-header uppercase text-slate-500 p-4">Date</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((move, i) => {
                const Icon = typeIcons[move.type]
                const color = typeColors[move.type]
                return (
                  <motion.tr
                    key={move.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.02 }}
                    className="border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors h-14"
                  >
                    <td className="p-4">
                      <div className={cn('w-8 h-8 rounded-full flex items-center justify-center', color)}>
                        <Icon className="w-4 h-4" />
                      </div>
                    </td>
                    <td className="p-4"><span className="font-mono text-sm text-indigo-600 font-medium">{move.reference}</span></td>
                    <td className="p-4">
                      <div>
                        <span className="text-sm font-medium text-slate-900 dark:text-white">{move.productName}</span>
                        <p className="text-xs font-mono text-slate-400">{move.productSku}</p>
                      </div>
                    </td>
                    <td className="p-4 text-sm text-slate-600">
                      <span>{move.fromLocation || '—'}</span>
                      <span className="mx-2 text-slate-300">→</span>
                      <span>{move.toLocation || '—'}</span>
                    </td>
                    <td className={cn('p-4 text-right font-mono font-bold text-sm', move.qty > 0 ? 'text-emerald-600' : 'text-red-600')}>
                      {move.qty > 0 ? '+' : ''}{move.qty} {move.uom}
                    </td>
                    <td className="p-4 text-sm text-slate-600">{move.movedByName}</td>
                    <td className="p-4 text-sm text-slate-400">{formatDistanceToNow(new Date(move.movedAt), { addSuffix: true })}</td>
                  </motion.tr>
                )
              })}
            </tbody>
          </table>
          {filtered.length === 0 && <EmptyState title="No moves found" description="Stock movements will appear here" />}
        </div>
      </Card>
    </div>
  )
}
