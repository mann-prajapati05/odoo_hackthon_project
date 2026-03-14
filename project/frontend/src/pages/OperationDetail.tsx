import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Pencil, CheckCircle2, XCircle, Printer, Copy, PackageCheck, Clock, ArrowRight, Check } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { useUIStore } from '@/store'
import { StatusBadge, OperationTypeBadge } from '@/components/shared/StatusBadge'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { OperationStatus, OperationTimeline } from '@/types'

const mockOperation = {
  id: '1', reference: 'RCP/2026/00012', type: 'receipt' as const, status: 'ready' as OperationStatus,
  supplierName: 'Steel Corp Ltd', scheduledDate: '2026-03-14', warehouseId: '1', warehouseName: 'Main Warehouse',
  notes: 'Urgent delivery — verify quantities carefully.', lineCount: 3,
  lines: [
    { id: '1', productId: '1', productName: 'Steel Rods (10mm)', productSku: 'SKU-00042', uom: 'kg', expectedQty: 100, doneQty: 100, destinationLocationName: 'Rack A' },
    { id: '2', productId: '2', productName: 'Copper Wire (2.5mm)', productSku: 'SKU-00087', uom: 'metre', expectedQty: 200, doneQty: 180, destinationLocationName: 'Rack B' },
    { id: '3', productId: '4', productName: 'Cement (50kg bags)', productSku: 'SKU-00015', uom: 'pcs', expectedQty: 50, doneQty: 50, destinationLocationName: 'Yard' },
  ],
  createdBy: '1', createdByName: 'John Doe', createdAt: '2026-03-14T10:30:00Z',
  validatedByName: undefined as string | undefined, validatedAt: undefined as string | undefined,
}

const mockTimeline: OperationTimeline[] = [
  { id: '1', action: 'Created operation', actorName: 'John Doe', status: 'draft', timestamp: '2026-03-14T10:30:00Z' },
  { id: '2', action: 'Marked as Ready', actorName: 'John Doe', status: 'ready', timestamp: '2026-03-14T11:15:00Z' },
]

const statusSteps = ['draft', 'waiting', 'ready', 'done']

export default function OperationDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { setPageTitle, setBreadcrumbs } = useUIStore()
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [cancelOpen, setCancelOpen] = useState(false)

  const op = mockOperation
  const currentStepIndex = statusSteps.indexOf(op.status)

  useEffect(() => {
    setPageTitle(op.reference)
    setBreadcrumbs([
      { label: 'Receipts', href: '/operations/receipts' },
      { label: op.reference },
    ])
  }, [setPageTitle, setBreadcrumbs])

  const totalExpected = op.lines.reduce((s, l) => s + l.expectedQty, 0)
  const totalDone = op.lines.reduce((s, l) => s + l.doneQty, 0)

  return (
    <div className="space-y-6">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-mono font-semibold text-slate-900 dark:text-white">{op.reference}</h2>
          <StatusBadge status={op.status} />
          <OperationTypeBadge type={op.type} />
        </div>
        <div className="flex items-center gap-2">
          {(op.status === 'draft' || op.status === 'waiting') && (
            <Button variant="outline" className="gap-2"><Pencil className="w-4 h-4" /> Edit</Button>
          )}
          {op.status === 'ready' && (
            <Button variant="success" className="gap-2" onClick={() => setConfirmOpen(true)}>
              <CheckCircle2 className="w-4 h-4" /> Validate Receipt
            </Button>
          )}
          {op.status !== 'done' && op.status !== 'cancelled' && (
            <Button variant="ghost" className="gap-2 text-red-600" onClick={() => setCancelOpen(true)}>
              <XCircle className="w-4 h-4" /> Cancel
            </Button>
          )}
          <Button variant="ghost" size="icon"><Printer className="w-4 h-4" /></Button>
          <Button variant="ghost" size="icon"><Copy className="w-4 h-4" /></Button>
        </div>
      </div>

      {/* Status Stepper */}
      {op.status !== 'cancelled' ? (
        <div className="flex items-center gap-0">
          {statusSteps.map((step, i) => {
            const isComplete = i < currentStepIndex
            const isCurrent = i === currentStepIndex
            return (
              <div key={step} className="flex items-center flex-1">
                <div className="flex flex-col items-center">
                  <div className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all text-xs font-bold',
                    isComplete && 'bg-indigo-600 border-indigo-600 text-white',
                    isCurrent && 'border-indigo-600 text-indigo-600 ring-4 ring-indigo-100',
                    !isComplete && !isCurrent && 'border-slate-300 text-slate-400'
                  )}>
                    {isComplete ? <Check className="w-4 h-4" /> : i + 1}
                  </div>
                  <span className={cn('text-[10px] mt-1 font-medium capitalize', isCurrent ? 'text-indigo-600' : 'text-slate-400')}>{step}</span>
                </div>
                {i < statusSteps.length - 1 && (
                  <div className={cn('flex-1 h-0.5 mx-2', isComplete ? 'bg-indigo-600' : 'bg-slate-200')} />
                )}
              </div>
            )
          })}
        </div>
      ) : (
        <Badge variant="destructive" className="text-sm px-4 py-1">Cancelled</Badge>
      )}

      {/* Two Column Content */}
      <div className="grid grid-cols-1 lg:grid-cols-10 gap-6">
        {/* Left — Products table */}
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
                      <td className="text-right font-mono text-sm">{line.expectedQty} {line.uom}</td>
                      <td className="text-right font-mono text-sm font-bold">{line.doneQty} {line.uom}</td>
                      <td className="text-sm text-slate-600">{line.destinationLocationName}</td>
                      <td>
                        {line.doneQty === line.expectedQty ? (
                          <Badge variant="success" className="text-[10px]">Full</Badge>
                        ) : (
                          <Badge variant="warning" className="text-[10px]">Partial: {line.doneQty}/{line.expectedQty}</Badge>
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

        {/* Right — Details */}
        <div className="lg:col-span-3">
          <Card>
            <CardContent className="p-6 space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-slate-500">Supplier</span><span className="font-medium">{op.supplierName}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Scheduled</span><span>{op.scheduledDate}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Warehouse</span><span>{op.warehouseName}</span></div>
              {op.notes && <div><span className="text-slate-500">Notes</span><p className="mt-1 text-slate-700 dark:text-slate-300">{op.notes}</p></div>}
              <div className="border-t pt-3">
                <div className="flex justify-between"><span className="text-slate-500">Created by</span><span>{op.createdByName}</span></div>
                <div className="flex justify-between mt-1"><span className="text-slate-500">Created</span><span>{formatDistanceToNow(new Date(op.createdAt), { addSuffix: true })}</span></div>
              </div>
              {op.validatedByName && (
                <div className="border-t pt-3 text-emerald-600">
                  <div className="flex justify-between"><span>Validated by</span><span>{op.validatedByName}</span></div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Timeline */}
      <Card>
        <CardHeader><CardTitle>Activity Timeline</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-4">
            {mockTimeline.map((event, i) => (
              <div key={event.id} className="flex items-start gap-4">
                <div className="flex flex-col items-center">
                  <div className={cn('w-8 h-8 rounded-full flex items-center justify-center', i === 0 ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-100 text-slate-400')}>
                    <Clock className="w-4 h-4" />
                  </div>
                  {i < mockTimeline.length - 1 && <div className="w-0.5 h-8 bg-slate-200 my-1" />}
                </div>
                <div>
                  <p className="text-sm"><span className="font-medium">{event.actorName}</span> — {event.action}</p>
                  <p className="text-xs text-slate-400">{new Date(event.timestamp).toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Validate Receipt?"
        description={`You are about to receive ${totalExpected} units of ${op.lines.length} products into ${op.warehouseName}.`}
        confirmLabel="Confirm & Validate"
        onConfirm={() => setConfirmOpen(false)}
      />
      <ConfirmDialog
        open={cancelOpen}
        onOpenChange={setCancelOpen}
        title="Cancel Operation?"
        description="This operation will be cancelled. This action cannot be undone."
        variant="danger"
        confirmLabel="Cancel Operation"
        onConfirm={() => setCancelOpen(false)}
      />
    </div>
  )
}
