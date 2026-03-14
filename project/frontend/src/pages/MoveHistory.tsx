import { useEffect, useMemo, useState } from 'react'
import { Download, Search, PackageCheck, Truck, ArrowLeftRight, Zap } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { formatDistanceToNow } from 'date-fns'

import { movesApi } from '@/api/moves'
import { useUIStore } from '@/store'
import { useDebounce } from '@/hooks'
import { PageHeader } from '@/components/shared/PageHeader'
import { EmptyState } from '@/components/shared/EmptyState'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

const typeIcons = { receipt: PackageCheck, delivery: Truck, transfer: ArrowLeftRight, adjustment: Zap }
const typeColors = {
  receipt: 'text-teal-600 bg-teal-50',
  delivery: 'text-indigo-600 bg-indigo-50',
  transfer: 'text-purple-600 bg-purple-50',
  adjustment: 'text-orange-600 bg-orange-50',
}

export default function MoveHistoryPage() {
  const { setPageTitle, setBreadcrumbs } = useUIStore()
  const [searchValue, setSearchValue] = useState('')
  const debouncedSearch = useDebounce(searchValue, 300)
  const [typeFilter, setTypeFilter] = useState<string>('')

  useEffect(() => {
    setPageTitle('Move History')
    setBreadcrumbs([])
  }, [setBreadcrumbs, setPageTitle])

  const filters = useMemo(
    () => ({
      search: debouncedSearch || undefined,
      type: typeFilter || undefined,
      page: 1,
      limit: 100,
    }),
    [debouncedSearch, typeFilter]
  )

  const { data } = useQuery({
    queryKey: ['move-history', filters],
    queryFn: () => movesApi.getAll(filters),
  })

  const moves = data?.data || []

  const handleExport = async () => {
    const blob = await movesApi.exportCsv(filters)
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'move-history.csv'
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Move History" count={moves.length}>
        <Button variant="outline" className="gap-2" onClick={handleExport}>
          <Download className="w-4 h-4" /> Export CSV
        </Button>
      </PageHeader>

      <Card>
        <CardContent className="p-4 flex flex-wrap items-center gap-3">
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input placeholder="Search product or reference..." value={searchValue} onChange={(e) => setSearchValue(e.target.value)} className="pl-10" />
          </div>
          <div className="flex gap-2">
            {[
              { key: '', label: 'All' },
              { key: 'receipt', label: 'Receipts' },
              { key: 'delivery', label: 'Deliveries' },
              { key: 'transfer', label: 'Transfers' },
              { key: 'adjustment', label: 'Adjustments' },
            ].map((t) => (
              <button
                key={t.key}
                onClick={() => setTypeFilter(t.key)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                  typeFilter === t.key
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700">
                <th className="text-left text-table-header uppercase text-slate-500 p-4 w-8"></th>
                <th className="text-left text-table-header uppercase text-slate-500 p-4">Reference</th>
                <th className="text-left text-table-header uppercase text-slate-500 p-4">Product</th>
                <th className="text-left text-table-header uppercase text-slate-500 p-4">From {'->'} To</th>
                <th className="text-right text-table-header uppercase text-slate-500 p-4">Quantity</th>
                <th className="text-left text-table-header uppercase text-slate-500 p-4">Moved By</th>
                <th className="text-left text-table-header uppercase text-slate-500 p-4">Date</th>
              </tr>
            </thead>
            <tbody>
              {moves.map((move) => {
                const Icon = typeIcons[move.type]
                const color = typeColors[move.type]
                return (
                  <tr key={move.id} className="border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors h-14">
                    <td className="p-4">
                      <div className={cn('w-8 h-8 rounded-full flex items-center justify-center', color)}>
                        <Icon className="w-4 h-4" />
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="font-mono text-sm text-indigo-600 font-medium">{move.reference || 'N/A'}</span>
                    </td>
                    <td className="p-4">
                      <div>
                        <span className="text-sm font-medium text-slate-900 dark:text-white">{move.productName}</span>
                        <p className="text-xs font-mono text-slate-400">{move.productSku}</p>
                      </div>
                    </td>
                    <td className="p-4 text-sm text-slate-600">
                      <span>{move.fromLocation || '�'}</span>
                      <span className="mx-2 text-slate-300">{'->'}</span>
                      <span>{move.toLocation || '�'}</span>
                    </td>
                    <td className={cn('p-4 text-right font-mono font-bold text-sm', move.qty > 0 ? 'text-emerald-600' : 'text-red-600')}>
                      {move.qty > 0 ? '+' : ''}
                      {move.qty} {move.uom}
                    </td>
                    <td className="p-4 text-sm text-slate-600">{move.movedByName}</td>
                    <td className="p-4 text-sm text-slate-400">{formatDistanceToNow(new Date(move.movedAt), { addSuffix: true })}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {moves.length === 0 && <EmptyState title="No moves found" description="Stock movements will appear here" />}
        </div>
      </Card>
    </div>
  )
}
