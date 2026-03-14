import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Boxes,
  AlertTriangle,
  XCircle,
  PackageCheck,
  Truck,
  PackagePlus,
  ArrowLeftRight,
  ArrowUpRight,
  Clock,
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { useUIStore } from '@/store'
import { KPICard } from '@/components/shared/KPICard'
import { StatusBadge, OperationTypeBadge, StockStatusBadge } from '@/components/shared/StatusBadge'
import { EmptyState } from '@/components/shared/EmptyState'
import { SkeletonKPICards } from '@/components/shared/Skeleton'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { DashboardKPIs, Operation, AlertItem, MoveHistory } from '@/types'

// Mock data for demonstration
const mockKPIs: DashboardKPIs = {
  totalProducts: 1247,
  lowStockItems: 23,
  outOfStock: 8,
  pendingReceipts: 12,
  pendingDeliveries: 15,
}

const mockOperations: Operation[] = [
  { id: '1', reference: 'RCP/2026/00012', type: 'receipt', status: 'done', supplierName: 'Steel Corp', scheduledDate: '2026-03-14', warehouseId: '1', warehouseName: 'Main Warehouse', lineCount: 3, lines: [], createdBy: '1', createdByName: 'John Doe', createdAt: new Date(Date.now() - 2 * 3600000).toISOString() },
  { id: '2', reference: 'DLV/2026/00008', type: 'delivery', status: 'ready', destinationName: 'Acme Ltd', scheduledDate: '2026-03-14', warehouseId: '1', warehouseName: 'Main Warehouse', lineCount: 5, lines: [], createdBy: '1', createdByName: 'Sarah Kim', createdAt: new Date(Date.now() - 4 * 3600000).toISOString() },
  { id: '3', reference: 'TRF/2026/00003', type: 'transfer', status: 'waiting', scheduledDate: '2026-03-13', warehouseId: '2', warehouseName: 'North Branch', lineCount: 2, lines: [], createdBy: '2', createdByName: 'Mike Chen', createdAt: new Date(Date.now() - 6 * 3600000).toISOString() },
  { id: '4', reference: 'ADJ/2026/00004', type: 'adjustment', status: 'done', scheduledDate: '2026-03-13', warehouseId: '1', warehouseName: 'Main Warehouse', lineCount: 8, lines: [], createdBy: '1', createdByName: 'John Doe', createdAt: new Date(Date.now() - 24 * 3600000).toISOString() },
  { id: '5', reference: 'RCP/2026/00011', type: 'receipt', status: 'draft', supplierName: 'Iron Works', scheduledDate: '2026-03-15', warehouseId: '1', warehouseName: 'Main Warehouse', lineCount: 4, lines: [], createdBy: '2', createdByName: 'Sarah Kim', createdAt: new Date(Date.now() - 28 * 3600000).toISOString() },
]

const mockAlerts: AlertItem[] = [
  { id: '1', productId: '1', productName: 'Steel Rods (10mm)', productSku: 'SKU-00042', currentQty: 12, reorderQty: 50, read: false },
  { id: '2', productId: '2', productName: 'Copper Wire (2.5mm)', productSku: 'SKU-00087', currentQty: 5, reorderQty: 30, read: false },
  { id: '3', productId: '3', productName: 'PVC Pipe (4")', productSku: 'SKU-00123', currentQty: 8, reorderQty: 25, read: true },
  { id: '4', productId: '4', productName: 'Cement (50kg bags)', productSku: 'SKU-00015', currentQty: 3, reorderQty: 20, read: false },
]

const mockActivity: MoveHistory[] = [
  { id: '1', operationId: '1', reference: 'RCP/2026/00012', type: 'receipt', productId: '1', productName: 'Steel Rods', productSku: 'SKU-00042', toWarehouse: 'Main Warehouse', toLocation: 'Rack A', qty: 50, uom: 'pcs', direction: 'incoming', movedBy: '1', movedByName: 'John Doe', movedAt: new Date(Date.now() - 1800000).toISOString() },
  { id: '2', operationId: '2', reference: 'DLV/2026/00007', type: 'delivery', productId: '2', productName: 'Copper Wire', productSku: 'SKU-00087', fromWarehouse: 'Main Warehouse', fromLocation: 'Rack B', qty: 10, uom: 'kg', direction: 'outgoing', movedBy: '2', movedByName: 'Sarah Kim', movedAt: new Date(Date.now() - 3600000).toISOString() },
  { id: '3', operationId: '3', reference: 'TRF/2026/00002', type: 'transfer', productId: '3', productName: 'PVC Pipes', productSku: 'SKU-00123', fromWarehouse: 'Main', fromLocation: 'Zone A', toWarehouse: 'North', toLocation: 'Zone B', qty: 25, uom: 'pcs', direction: 'internal', movedBy: '1', movedByName: 'John Doe', movedAt: new Date(Date.now() - 7200000).toISOString() },
  { id: '4', operationId: '4', reference: 'ADJ/2026/00004', type: 'adjustment', productId: '4', productName: 'Cement Bags', productSku: 'SKU-00015', toWarehouse: 'Main Warehouse', toLocation: 'Yard', qty: -3, uom: 'bags', direction: 'adjustment', movedBy: '1', movedByName: 'John Doe', movedAt: new Date(Date.now() - 14400000).toISOString() },
]

const typeIconColors: Record<string, string> = {
  receipt: 'text-teal-600 bg-teal-50',
  delivery: 'text-indigo-600 bg-indigo-50',
  transfer: 'text-purple-600 bg-purple-50',
  adjustment: 'text-orange-600 bg-orange-50',
}

export default function Dashboard() {
  const { setPageTitle, setBreadcrumbs } = useUIStore()
  const navigate = useNavigate()

  useEffect(() => {
    setPageTitle('Dashboard')
    setBreadcrumbs([])
  }, [setPageTitle, setBreadcrumbs])

  const kpis = mockKPIs
  const operations = mockOperations
  const alerts = mockAlerts
  const activity = mockActivity

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        <KPICard
          label="Total Products"
          value={kpis.totalProducts}
          icon={Boxes}
          accentColor="bg-teal-500"
          onLinkClick={() => navigate('/products')}
        />
        <KPICard
          label="Low Stock Items"
          value={kpis.lowStockItems}
          icon={AlertTriangle}
          accentColor="bg-amber-500"
          onLinkClick={() => navigate('/products?stockStatus=low_stock')}
        />
        <KPICard
          label="Out of Stock"
          value={kpis.outOfStock}
          icon={XCircle}
          accentColor="bg-red-500"
          onLinkClick={() => navigate('/products?stockStatus=out_of_stock')}
        />
        <KPICard
          label="Pending Receipts"
          value={kpis.pendingReceipts}
          icon={PackageCheck}
          accentColor="bg-sky-500"
          onLinkClick={() => navigate('/operations/receipts?status=ready,waiting')}
        />
        <KPICard
          label="Pending Deliveries"
          value={kpis.pendingDeliveries}
          icon={Truck}
          accentColor="bg-indigo-500"
          onLinkClick={() => navigate('/operations/deliveries?status=ready,waiting')}
        />
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-3">
        <Button variant="outline" className="gap-2" onClick={() => navigate('/operations/receipts/new')}>
          <PackagePlus className="w-4 h-4" /> New Receipt
        </Button>
        <Button variant="outline" className="gap-2" onClick={() => navigate('/operations/deliveries/new')}>
          <Truck className="w-4 h-4" /> New Delivery
        </Button>
        <Button variant="outline" className="gap-2" onClick={() => navigate('/operations/transfers/new')}>
          <ArrowLeftRight className="w-4 h-4" /> New Transfer
        </Button>
      </div>

      {/* Main Content — Two Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left — Recent Operations (3/5) */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Recent Operations</CardTitle>
                <button
                  onClick={() => navigate('/operations/receipts')}
                  className="text-sm text-indigo-600 hover:underline flex items-center gap-1"
                >
                  View all <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="all">
                <TabsList className="mb-4">
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="receipt">Receipts</TabsTrigger>
                  <TabsTrigger value="delivery">Deliveries</TabsTrigger>
                  <TabsTrigger value="transfer">Transfers</TabsTrigger>
                  <TabsTrigger value="adjustment">Adjustments</TabsTrigger>
                </TabsList>

                {['all', 'receipt', 'delivery', 'transfer', 'adjustment'].map((tab) => (
                  <TabsContent key={tab} value={tab}>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-slate-100 dark:border-slate-800">
                            <th className="text-left text-table-header uppercase text-slate-500 pb-3 pr-4">Reference</th>
                            <th className="text-left text-table-header uppercase text-slate-500 pb-3 pr-4">Type</th>
                            <th className="text-left text-table-header uppercase text-slate-500 pb-3 pr-4">Status</th>
                            <th className="text-left text-table-header uppercase text-slate-500 pb-3 pr-4">Products</th>
                            <th className="text-left text-table-header uppercase text-slate-500 pb-3 pr-4">Warehouse</th>
                            <th className="text-left text-table-header uppercase text-slate-500 pb-3">Date</th>
                          </tr>
                        </thead>
                        <tbody>
                          {operations
                            .filter((op) => tab === 'all' || op.type === tab)
                            .map((op, i) => (
                              <motion.tr
                                key={op.id}
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.04 }}
                                onClick={() => navigate(`/operations/${op.type === 'receipt' ? 'receipts' : op.type === 'delivery' ? 'deliveries' : op.type === 'transfer' ? 'transfers' : 'adjustments'}/${op.id}`)}
                                className="border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors h-14"
                              >
                                <td className="pr-4">
                                  <span className="font-mono text-sm text-indigo-600 dark:text-indigo-400 font-medium">
                                    {op.reference}
                                  </span>
                                </td>
                                <td className="pr-4"><OperationTypeBadge type={op.type} /></td>
                                <td className="pr-4"><StatusBadge status={op.status} /></td>
                                <td className="pr-4 text-sm text-slate-600 dark:text-slate-400">{op.lineCount} items</td>
                                <td className="pr-4 text-sm text-slate-600 dark:text-slate-400">{op.warehouseName}</td>
                                <td className="text-sm text-slate-400">
                                  {formatDistanceToNow(new Date(op.createdAt), { addSuffix: true })}
                                </td>
                              </motion.tr>
                            ))}
                        </tbody>
                      </table>
                      {operations.filter((op) => tab === 'all' || op.type === tab).length === 0 && (
                        <EmptyState title="No recent operations" description="Operations will appear here once created" />
                      )}
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Right column — Alerts + Activity (2/5) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Low Stock Alerts */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-base">Low Stock Alerts</CardTitle>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400">
                    {alerts.length}
                  </span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {alerts.map((alert) => {
                  const percentage = Math.min(100, (alert.currentQty / alert.reorderQty) * 100)
                  return (
                    <div
                      key={alert.id}
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse-dot flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                            {alert.productName}
                          </p>
                          <span className="text-sm font-mono text-red-600 dark:text-red-400 flex-shrink-0 ml-2">
                            {alert.currentQty}/{alert.reorderQty}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400">{alert.productSku}</p>
                        {/* Progress bar */}
                        <div className="mt-1.5 h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-amber-500 rounded-full transition-all"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                      <button
                        onClick={() => navigate(`/products/${alert.productId}`)}
                        className="text-xs text-indigo-600 hover:underline flex-shrink-0"
                      >
                        View
                      </button>
                    </div>
                  )
                })}
              </div>
              <button
                onClick={() => navigate('/products?stockStatus=low_stock')}
                className="w-full text-center text-sm text-indigo-600 hover:underline mt-3 pt-3 border-t border-slate-100 dark:border-slate-800"
              >
                View all low stock →
              </button>
            </CardContent>
          </Card>

          {/* Activity Feed */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-base">Recent Activity</CardTitle>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse-dot" />
                    Live
                  </span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {activity.map((move) => (
                  <div key={move.id} className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${typeIconColors[move.type]}`}>
                      {move.type === 'receipt' && <PackageCheck className="w-4 h-4" />}
                      {move.type === 'delivery' && <Truck className="w-4 h-4" />}
                      {move.type === 'transfer' && <ArrowLeftRight className="w-4 h-4" />}
                      {move.type === 'adjustment' && <Clock className="w-4 h-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-700 dark:text-slate-300">
                        <span className="font-medium">{move.movedByName}</span>
                        {' '}validated{' '}
                        <span className="font-mono text-indigo-600 dark:text-indigo-400">{move.reference}</span>
                        {' — '}
                        <span className={move.qty > 0 ? 'text-emerald-600' : 'text-red-600'}>
                          {move.qty > 0 ? '+' : ''}{move.qty} {move.productName}
                        </span>
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {formatDistanceToNow(new Date(move.movedAt), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
