import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Check, CheckCircle2, Clock, Copy, XCircle } from 'lucide-react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { formatDistanceToNow } from 'date-fns'
import toast from 'react-hot-toast'

import { operationsApi } from '@/api/operations'
import { useUIStore } from '@/store'
import { StatusBadge, OperationTypeBadge } from '@/components/shared/StatusBadge'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { EmptyState } from '@/components/shared/EmptyState'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

const statusSteps = ['draft', 'waiting', 'ready', 'in_progress', 'done'] as const

export default function OperationDetail() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { setPageTitle, setBreadcrumbs } = useUIStore()

  const [confirmOpen, setConfirmOpen] = useState(false)
  const [cancelOpen, setCancelOpen] = useState(false)

  const { data: op, isLoading } = useQuery({
    queryKey: ['operation', id],
    queryFn: () => operationsApi.getById(id),
    enabled: Boolean(id),
  })

  const { data: timeline = [] } = useQuery({
    queryKey: ['operation-timeline', id],
    queryFn: () => operationsApi.getTimeline(id),
    enabled: Boolean(id),
  })

  useEffect(() => {
    if (!op) return

    const listRouteMap = {
      receipt: '/operations/receipts',
      delivery: '/operations/deliveries',
      transfer: '/operations/transfers',
      adjustment: '/operations/adjustments',
    }

    setPageTitle(op.reference)
    setBreadcrumbs([
      { label: 'Operations', href: listRouteMap[op.type] },
      { label: op.reference },
    ])
  }, [op, setBreadcrumbs, setPageTitle])

  const validateMutation = useMutation({
    mutationFn: () => operationsApi.validate(id),
    onSuccess: () => {
      toast.success('Operation validated')
      setConfirmOpen(false)
      queryClient.invalidateQueries({ queryKey: ['operation', id] })
      queryClient.invalidateQueries({ queryKey: ['operation-timeline', id] })
      queryClient.invalidateQueries({ queryKey: ['operations'] })
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : 'Failed to validate operation'),
  })

  const cancelMutation = useMutation({
    mutationFn: () => operationsApi.cancel(id),
    onSuccess: () => {
      toast.success('Operation cancelled')
      setCancelOpen(false)
      queryClient.invalidateQueries({ queryKey: ['operation', id] })
      queryClient.invalidateQueries({ queryKey: ['operation-timeline', id] })
      queryClient.invalidateQueries({ queryKey: ['operations'] })
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : 'Failed to cancel operation'),
  })

  const duplicateMutation = useMutation({
    mutationFn: () => operationsApi.duplicate(id),
    onSuccess: (duplicated) => {
      toast.success('Operation duplicated')
      navigate(`/operations/${duplicated.type}s/${duplicated.id}`)
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : 'Failed to duplicate operation'),
  })

  const currentStepIndex = useMemo(() => {
    if (!op) return -1
    return statusSteps.indexOf(op.status as (typeof statusSteps)[number])
  }, [op])

  if (isLoading) {
    return <div className="text-sm text-slate-500">Loading operation...</div>
  }

  if (!op) {
    return <EmptyState title="Operation not found" description="This operation no longer exists or is unavailable." />
  }

  const totalExpected = op.lines.reduce((s, l) => s + l.expectedQty, 0)
  const totalDone = op.lines.reduce((s, l) => s + l.doneQty, 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-mono font-semibold text-slate-900 dark:text-white">{op.reference}</h2>
          <StatusBadge status={op.status} />
          <OperationTypeBadge type={op.type} />
        </div>
        <div className="flex items-center gap-2">
          {op.status === 'ready' && (
            <Button variant="success" className="gap-2" onClick={() => setConfirmOpen(true)}>
              <CheckCircle2 className="w-4 h-4" /> Validate
            </Button>
          )}
          {op.status !== 'done' && op.status !== 'cancelled' && (
            <Button variant="ghost" className="gap-2 text-red-600" onClick={() => setCancelOpen(true)}>
              <XCircle className="w-4 h-4" /> Cancel
            </Button>
          )}
          <Button variant="outline" className="gap-2" onClick={() => duplicateMutation.mutate()}>
            <Copy className="w-4 h-4" /> Duplicate
          </Button>
        </div>
      </div>

      {op.status !== 'cancelled' ? (
        <div className="flex items-center gap-0">
          {statusSteps.map((step, i) => {
            const isComplete = i < currentStepIndex
            const isCurrent = i === currentStepIndex
            return (
              <div key={step} className="flex items-center flex-1">
                <div className="flex flex-col items-center">
                  <div
                    className={cn(
                      'w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all text-xs font-bold',
                      isComplete && 'bg-indigo-600 border-indigo-600 text-white',
                      isCurrent && 'border-indigo-600 text-indigo-600 ring-4 ring-indigo-100',
                      !isComplete && !isCurrent && 'border-slate-300 text-slate-400'
                    )}
                  >
                    {isComplete ? <Check className="w-4 h-4" /> : i + 1}
                  </div>
                  <span className={cn('text-[10px] mt-1 font-medium capitalize', isCurrent ? 'text-indigo-600' : 'text-slate-400')}>
                    {step.replace('_', ' ')}
                  </span>
                </div>
                {i < statusSteps.length - 1 && (
                  <div className={cn('flex-1 h-0.5 mx-2', isComplete ? 'bg-indigo-600' : 'bg-slate-200')} />
                )}
              </div>
            )
          })}
        </div>
      ) : (
        <Badge variant="destructive" className="text-sm px-4 py-1">
          Cancelled
        </Badge>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-10 gap-6">
        <div className="lg:col-span-7">
          <Card>
            <CardHeader>
              <CardTitle>Products</CardTitle>
            </CardHeader>
            <CardContent>
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700">
                    <th className="text-left text-table-header uppercase text-slate-500 pb-3">Product</th>
                    <th className="text-right text-table-header uppercase text-slate-500 pb-3">Expected</th>
                    <th className="text-right text-table-header uppercase text-slate-500 pb-3">Done</th>
                    <th className="text-left text-table-header uppercase text-slate-500 pb-3">Location</th>
                    <th className="text-left text-table-header uppercase text-slate-500 pb-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {op.lines.map((line) => (
                    <tr key={line.id} className="border-b border-slate-50 dark:border-slate-800/50 h-14">
                      <td>
                        <div>
                          <span className="text-sm font-medium text-slate-900 dark:text-white">{line.productName}</span>
                          <p className="text-xs font-mono text-slate-400">{line.productSku}</p>
                        </div>
                      </td>
                      <td className="text-right font-mono text-sm">
                        {line.expectedQty} {line.uom}
                      </td>
                      <td className="text-right font-mono text-sm font-bold">
                        {line.doneQty} {line.uom}
                      </td>
                      <td className="text-sm text-slate-600">{line.destinationLocationName || '—'}</td>
                      <td>
                        {line.doneQty === line.expectedQty ? (
                          <Badge variant="success" className="text-[10px]">
                            Full
                          </Badge>
                        ) : (
                          <Badge variant="warning" className="text-[10px]">
                            Partial
                          </Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="font-bold border-t-2 border-slate-200 dark:border-slate-600">
                    <td className="text-sm pt-3">Total</td>
                    <td className="text-right font-mono text-sm pt-3">{totalExpected}</td>
                    <td className="text-right font-mono text-sm pt-3">{totalDone}</td>
                    <td colSpan={2}></td>
                  </tr>
                </tfoot>
              </table>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-3">
          <Card>
            <CardContent className="p-6 space-y-3 text-sm">
              {op.supplierName && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Supplier</span>
                  <span className="font-medium">{op.supplierName}</span>
                </div>
              )}
              {op.destinationName && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Destination</span>
                  <span className="font-medium">{op.destinationName}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-slate-500">Scheduled</span>
                <span>{op.scheduledDate ? new Date(op.scheduledDate).toLocaleDateString() : '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Warehouse</span>
                <span>{op.warehouseName}</span>
              </div>
              {op.notes && (
                <div>
                  <span className="text-slate-500">Notes</span>
                  <p className="mt-1 text-slate-700 dark:text-slate-300">{op.notes}</p>
                </div>
              )}
              <div className="border-t pt-3">
                <div className="flex justify-between">
                  <span className="text-slate-500">Created by</span>
                  <span>{op.createdByName || 'System'}</span>
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-slate-500">Created</span>
                  <span>{formatDistanceToNow(new Date(op.createdAt), { addSuffix: true })}</span>
                </div>
              </div>
              {op.validatedByName && (
                <div className="border-t pt-3 text-emerald-600">
                  <div className="flex justify-between">
                    <span>Validated by</span>
                    <span>{op.validatedByName}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Activity Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          {timeline.length === 0 ? (
            <EmptyState title="No activity yet" description="Timeline entries will appear as this operation progresses." />
          ) : (
            <div className="space-y-4">
              {timeline.map((event, i) => (
                <div key={event.id} className="flex items-start gap-4">
                  <div className="flex flex-col items-center">
                    <div className={cn('w-8 h-8 rounded-full flex items-center justify-center', i === 0 ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-100 text-slate-400')}>
                      <Clock className="w-4 h-4" />
                    </div>
                    {i < timeline.length - 1 && <div className="w-0.5 h-8 bg-slate-200 my-1" />}
                  </div>
                  <div>
                    <p className="text-sm">
                      <span className="font-medium">{event.actorName || 'System'}</span> - {event.action}
                    </p>
                    <p className="text-xs text-slate-400">{new Date(event.timestamp).toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Validate Operation"
        description={`You are about to validate ${op.reference}.`}
        loading={validateMutation.isPending}
        confirmLabel="Confirm & Validate"
        onConfirm={() => validateMutation.mutate()}
      />
      <ConfirmDialog
        open={cancelOpen}
        onOpenChange={setCancelOpen}
        title="Cancel Operation"
        description="This operation will be cancelled. This action cannot be undone."
        variant="danger"
        loading={cancelMutation.isPending}
        confirmLabel="Cancel Operation"
        onConfirm={() => cancelMutation.mutate()}
      />
    </div>
  )
}
