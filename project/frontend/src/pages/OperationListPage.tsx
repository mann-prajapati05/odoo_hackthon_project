import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { MoreHorizontal, Plus, Search, Copy, XCircle, Eye } from 'lucide-react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { formatDistanceToNow } from 'date-fns'
import toast from 'react-hot-toast'

import { operationsApi } from '@/api/operations'
import { useDebounce } from '@/hooks'
import { useUIStore } from '@/store'
import { PageHeader } from '@/components/shared/PageHeader'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { EmptyState } from '@/components/shared/EmptyState'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import type { OperationType } from '@/types'

interface OperationListPageProps {
  type: OperationType
  title: string
  newRoute: string
}

export default function OperationListPage({ type, title, newRoute }: OperationListPageProps) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [searchParams, setSearchParams] = useSearchParams()
  const { setPageTitle, setBreadcrumbs } = useUIStore()

  const [searchValue, setSearchValue] = useState(searchParams.get('search') || '')
  const [cancelTargetId, setCancelTargetId] = useState<string | null>(null)

  const debouncedSearch = useDebounce(searchValue, 300)
  const activeStatus = searchParams.get('status') || ''

  useEffect(() => {
    setPageTitle(title)
    setBreadcrumbs([])
  }, [setBreadcrumbs, setPageTitle, title])

  const filters = useMemo(
    () => ({
      search: debouncedSearch || undefined,
      status: activeStatus || undefined,
      page: Number(searchParams.get('page') || 1),
      limit: 20,
    }),
    [activeStatus, debouncedSearch, searchParams]
  )

  const { data, isLoading } = useQuery({
    queryKey: ['operations', type, filters],
    queryFn: () => operationsApi.getAll(type, filters),
  })

  const { data: counts } = useQuery({
    queryKey: ['operation-counts', type],
    queryFn: () => operationsApi.getCounts(type),
  })

  const cancelMutation = useMutation({
    mutationFn: (id: string) => operationsApi.cancel(id),
    onSuccess: () => {
      toast.success('Operation cancelled')
      queryClient.invalidateQueries({ queryKey: ['operations', type] })
      queryClient.invalidateQueries({ queryKey: ['operation-counts', type] })
      setCancelTargetId(null)
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to cancel operation')
    },
  })

  const duplicateMutation = useMutation({
    mutationFn: (id: string) => operationsApi.duplicate(id),
    onSuccess: () => {
      toast.success('Operation duplicated')
      queryClient.invalidateQueries({ queryKey: ['operations', type] })
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to duplicate operation')
    },
  })

  const tabs = [
    { key: '', label: 'All', count: counts?.all ?? 0 },
    { key: 'draft', label: 'Draft', count: counts?.draft ?? 0 },
    { key: 'waiting', label: 'Waiting', count: counts?.waiting ?? 0 },
    { key: 'ready', label: 'Ready', count: counts?.ready ?? 0 },
    { key: 'done', label: 'Done', count: counts?.done ?? 0 },
    { key: 'cancelled', label: 'Cancelled', count: counts?.cancelled ?? 0 },
  ]

  const operations = data?.data || []

  const detailRoute = (id: string) => {
    const routes: Record<OperationType, string> = {
      receipt: 'receipts',
      delivery: 'deliveries',
      transfer: 'transfers',
      adjustment: 'adjustments',
    }
    return `/operations/${routes[type]}/${id}`
  }

  return (
    <div className="space-y-6">
      <PageHeader title={title} count={data?.meta.total ?? operations.length}>
        <Button className="gap-2" onClick={() => navigate(newRoute)}>
          <Plus className="w-4 h-4" /> New {title.slice(0, -1)}
        </Button>
      </PageHeader>

      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => {
              const next = new URLSearchParams(searchParams)
              if (tab.key) next.set('status', tab.key)
              else next.delete('status')
              setSearchParams(next)
            }}
            className={cn(
              'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5',
              activeStatus === tab.key || (!activeStatus && !tab.key)
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
            )}
          >
            {tab.label}
            <Badge
              variant="secondary"
              className={cn(
                'text-[10px] px-1.5 py-0 min-w-[20px]',
                activeStatus === tab.key || (!activeStatus && !tab.key) ? 'bg-indigo-500 text-white' : ''
              )}
            >
              {tab.count}
            </Badge>
          </button>
        ))}
      </div>

      <Card>
        <CardContent className="p-4 flex flex-wrap items-center gap-3">
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search by reference..."
              value={searchValue}
              onChange={(e) => {
                setSearchValue(e.target.value)
                const next = new URLSearchParams(searchParams)
                if (e.target.value) next.set('search', e.target.value)
                else next.delete('search')
                setSearchParams(next)
              }}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

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
              {operations.map((op) => (
                <tr
                  key={op.id}
                  onClick={() => navigate(detailRoute(op.id))}
                  className="border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors h-14"
                >
                  <td className="p-4">
                    <span className="font-mono text-sm text-indigo-600 font-medium">{op.reference}</span>
                  </td>
                  {type === 'receipt' && <td className="p-4 text-sm text-slate-600">{op.supplierName || '—'}</td>}
                  {type === 'delivery' && <td className="p-4 text-sm text-slate-600">{op.destinationName || '—'}</td>}
                  <td className="p-4 text-sm text-slate-600">{op.scheduledDate ? new Date(op.scheduledDate).toLocaleDateString() : '—'}</td>
                  <td className="p-4 text-sm text-slate-600 text-center">{op.lineCount}</td>
                  <td className="p-4 text-sm text-slate-600">{op.warehouseName}</td>
                  <td className="p-4"><StatusBadge status={op.status} /></td>
                  <td className="p-4 text-sm text-slate-400">{formatDistanceToNow(new Date(op.createdAt), { addSuffix: true })}</td>
                  <td className="p-4" onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => navigate(detailRoute(op.id))}>
                          <Eye className="w-4 h-4 mr-2" /> View
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => duplicateMutation.mutate(op.id)}>
                          <Copy className="w-4 h-4 mr-2" /> Duplicate
                        </DropdownMenuItem>
                        {op.status !== 'done' && op.status !== 'cancelled' && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-red-600" onClick={() => setCancelTargetId(op.id)}>
                              <XCircle className="w-4 h-4 mr-2" /> Cancel
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!isLoading && operations.length === 0 && (
            <EmptyState
              title={`No ${title.toLowerCase()}`}
              description="Operations will appear here"
              actionLabel={`New ${title.slice(0, -1)}`}
              onAction={() => navigate(newRoute)}
            />
          )}
        </div>
      </Card>

      <ConfirmDialog
        open={Boolean(cancelTargetId)}
        onOpenChange={(open) => {
          if (!open) setCancelTargetId(null)
        }}
        title="Cancel Operation"
        description="This operation will be cancelled and can no longer be processed."
        variant="danger"
        loading={cancelMutation.isPending}
        confirmLabel="Cancel Operation"
        onConfirm={() => {
          if (cancelTargetId) cancelMutation.mutate(cancelTargetId)
        }}
      />
    </div>
  )
}
