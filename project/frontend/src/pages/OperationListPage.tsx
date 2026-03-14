import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Plus, Search, X, MoreHorizontal, Eye, Pencil, Copy, XCircle, Calendar } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { useUIStore } from '@/store'
import { useDebounce } from '@/hooks'
import { PageHeader } from '@/components/shared/PageHeader'
import { StatusBadge, OperationTypeBadge } from '@/components/shared/StatusBadge'
import { EmptyState } from '@/components/shared/EmptyState'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import type { Operation, OperationCounts, OperationType } from '@/types'

interface OperationListPageProps {
  type: OperationType
  title: string
  newRoute: string
}

const mockCounts: OperationCounts = { all: 48, draft: 5, waiting: 12, ready: 8, in_progress: 0, done: 20, cancelled: 3 }

const STATUSES = ['draft', 'waiting', 'ready', 'done', 'cancelled'] as const

function getMockOps(type: OperationType): Operation[] {
  const prefix: Record<string, string> = { receipt: 'RCP', delivery: 'DLV', transfer: 'TRF', adjustment: 'ADJ' }
  return Array.from({ length: 8 }, (_, i) => ({
    id: String(i + 1), reference: `${prefix[type]}/2026/${String(i + 1).padStart(5, '0')}`, type, status: STATUSES[i % 5]!,
    supplierName: type === 'receipt' ? `Supplier ${i + 1}` : undefined, destinationName: type === 'delivery' ? `Customer ${i + 1}` : undefined,
    scheduledDate: '2026-03-14', warehouseId: '1', warehouseName: 'Main Warehouse', lineCount: 2 + i, lines: [],
    createdBy: '1', createdByName: i % 2 === 0 ? 'John Doe' : 'Sarah Kim',
    createdAt: new Date(Date.now() - i * 3600000 * 4).toISOString(), notes: '',
  }))
}

export default function OperationListPage({ type, title, newRoute }: OperationListPageProps) {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { setPageTitle, setBreadcrumbs } = useUIStore()
  const [searchValue, setSearchValue] = useState('')
  const debouncedSearch = useDebounce(searchValue, 300)
  const activeStatus = searchParams.get('status') || ''

  useEffect(() => {
    setPageTitle(title)
    setBreadcrumbs([])
  }, [setPageTitle, setBreadcrumbs, title])

  const operations = getMockOps(type)
  const filtered = operations.filter((op) => {
    if (activeStatus && op.status !== activeStatus) return false
    if (debouncedSearch && !op.reference.toLowerCase().includes(debouncedSearch.toLowerCase())) return false
    return true
  })

  const tabs = [
    { key: '', label: 'All', count: mockCounts.all },
    { key: 'draft', label: 'Draft', count: mockCounts.draft },
    { key: 'waiting', label: 'Waiting', count: mockCounts.waiting },
    { key: 'ready', label: 'Ready', count: mockCounts.ready },
    { key: 'done', label: 'Done', count: mockCounts.done },
    { key: 'cancelled', label: 'Cancelled', count: mockCounts.cancelled },
  ]

  const detailRoute = (id: string) => {
    const routes: Record<string, string> = { receipt: 'receipts', delivery: 'deliveries', transfer: 'transfers', adjustment: 'adjustments' }
    return `/operations/${routes[type]}/${id}`
  }

  return (
    <div className="space-y-6">
      <PageHeader title={title} count={filtered.length}>
        <Button className="gap-2" onClick={() => navigate(newRoute)}>
          <Plus className="w-4 h-4" /> New {title.slice(0, -1)}
        </Button>
      </PageHeader>

      {/* Status Tabs */}
      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => {
              if (tab.key) setSearchParams({ status: tab.key })
              else { searchParams.delete('status'); setSearchParams(searchParams) }
            }}
            className={cn(
              'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5',
              activeStatus === tab.key || (!activeStatus && !tab.key)
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
            )}
          >
            {tab.label}
            <Badge variant="secondary" className={cn('text-[10px] px-1.5 py-0 min-w-[20px]',
              (activeStatus === tab.key || (!activeStatus && !tab.key)) ? 'bg-indigo-500 text-white' : ''
            )}>
              {tab.count}
            </Badge>
          </button>
        ))}
      </div>

      {/* Filter Bar */}
      <Card>
        <CardContent className="p-4 flex flex-wrap items-center gap-3">
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input placeholder="Search by reference..." value={searchValue} onChange={(e) => setSearchValue(e.target.value)} className="pl-10" />
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700">
                <th className="text-left text-table-header uppercase text-slate-500 p-4">Reference</th>
                {type === 'receipt' && <th className="text-left text-table-header uppercase text-slate-500 p-4">Supplier</th>}
                {type === 'delivery' && <th className="text-left text-table-header uppercase text-slate-500 p-4">Customer</th>}
                <th className="text-left text-table-header uppercase text-slate-500 p-4">Scheduled</th>
                <th className="text-center text-table-header uppercase text-slate-500 p-4"># Products</th>
                <th className="text-left text-table-header uppercase text-slate-500 p-4">Warehouse</th>
                <th className="text-left text-table-header uppercase text-slate-500 p-4">Status</th>
                <th className="text-left text-table-header uppercase text-slate-500 p-4">Created</th>
                <th className="w-10 p-4"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((op, i) => (
                <motion.tr
                  key={op.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  onClick={() => navigate(detailRoute(op.id))}
                  className="border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors h-14"
                >
                  <td className="p-4"><span className="font-mono text-sm text-indigo-600 font-medium">{op.reference}</span></td>
                  {type === 'receipt' && <td className="p-4 text-sm text-slate-600">{op.supplierName}</td>}
                  {type === 'delivery' && <td className="p-4 text-sm text-slate-600">{op.destinationName}</td>}
                  <td className="p-4 text-sm text-slate-600">{op.scheduledDate}</td>
                  <td className="p-4 text-sm text-slate-600 text-center">{op.lineCount}</td>
                  <td className="p-4 text-sm text-slate-600">{op.warehouseName}</td>
                  <td className="p-4"><StatusBadge status={op.status} /></td>
                  <td className="p-4 text-sm text-slate-400">{formatDistanceToNow(new Date(op.createdAt), { addSuffix: true })}</td>
                  <td className="p-4" onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="w-4 h-4" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => navigate(detailRoute(op.id))}><Eye className="w-4 h-4 mr-2" /> View</DropdownMenuItem>
                        {op.status === 'draft' && <DropdownMenuItem><Pencil className="w-4 h-4 mr-2" /> Edit</DropdownMenuItem>}
                        <DropdownMenuItem><Copy className="w-4 h-4 mr-2" /> Duplicate</DropdownMenuItem>
                        {op.status !== 'done' && <><DropdownMenuSeparator /><DropdownMenuItem className="text-red-600"><XCircle className="w-4 h-4 mr-2" /> Cancel</DropdownMenuItem></>}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && <EmptyState title={`No ${title.toLowerCase()}`} description="Operations will appear here" actionLabel={`New ${title.slice(0, -1)}`} onAction={() => navigate(newRoute)} />}
        </div>
      </Card>
    </div>
  )
}
