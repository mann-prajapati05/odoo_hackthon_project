import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Boxes, AlertTriangle, XCircle, PackageCheck, Truck, ArrowUpRight } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { formatDistanceToNow } from 'date-fns'

import { dashboardApi } from '@/api/dashboard'
import { useUIStore } from '@/store'
import { KPICard } from '@/components/shared/KPICard'
import { StatusBadge, OperationTypeBadge, StockStatusBadge } from '@/components/shared/StatusBadge'
import { EmptyState } from '@/components/shared/EmptyState'
import { SkeletonKPICards } from '@/components/shared/Skeleton'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function Dashboard() {
  const { setPageTitle, setBreadcrumbs } = useUIStore()
  const navigate = useNavigate()

  useEffect(() => {
    setPageTitle('Dashboard')
    setBreadcrumbs([])
  }, [setBreadcrumbs, setPageTitle])

  const { data: kpis, isLoading: kpisLoading } = useQuery({
    queryKey: ['dashboard-kpis'],
    queryFn: () => dashboardApi.getKPIs(),
    refetchInterval: 120000,
  })

  const { data: operations = [] } = useQuery({
    queryKey: ['dashboard-recent-operations'],
    queryFn: () => dashboardApi.getRecentOperations(8),
  })

  const { data: alerts = [] } = useQuery({
    queryKey: ['dashboard-low-stock'],
    queryFn: () => dashboardApi.getLowStockAlerts(8),
  })

  const { data: activity = [] } = useQuery({
    queryKey: ['dashboard-recent-activity'],
    queryFn: () => dashboardApi.getRecentMoves(8),
  })

  if (kpisLoading || !kpis) {
    return <SkeletonKPICards />
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        <KPICard label="Total Products" value={kpis.totalProducts} icon={Boxes} accentColor="bg-teal-500" onLinkClick={() => navigate('/products')} />
        <KPICard label="Low Stock Items" value={kpis.lowStockItems} icon={AlertTriangle} accentColor="bg-amber-500" onLinkClick={() => navigate('/products?stockStatus=low_stock')} />
        <KPICard label="Out of Stock" value={kpis.outOfStock} icon={XCircle} accentColor="bg-red-500" onLinkClick={() => navigate('/products?stockStatus=out_of_stock')} />
        <KPICard label="Pending Receipts" value={kpis.pendingReceipts} icon={PackageCheck} accentColor="bg-sky-500" onLinkClick={() => navigate('/operations/receipts?status=ready')} />
        <KPICard label="Pending Deliveries" value={kpis.pendingDeliveries} icon={Truck} accentColor="bg-indigo-500" onLinkClick={() => navigate('/operations/deliveries?status=ready')} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Recent Operations</CardTitle>
                <button onClick={() => navigate('/operations/receipts')} className="text-sm text-indigo-600 hover:underline flex items-center gap-1">
                  View all <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </CardHeader>
            <CardContent>
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
                    {operations.map((op) => (
                      <tr key={op.id} className="border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors h-14">
                        <td className="pr-4">
                          <span className="font-mono text-sm text-indigo-600 dark:text-indigo-400 font-medium">{op.reference}</span>
                        </td>
                        <td className="pr-4"><OperationTypeBadge type={op.type} /></td>
                        <td className="pr-4"><StatusBadge status={op.status} /></td>
                        <td className="pr-4 text-sm text-slate-600 dark:text-slate-400">{op.lineCount} items</td>
                        <td className="pr-4 text-sm text-slate-600 dark:text-slate-400">{op.warehouseName}</td>
                        <td className="text-sm text-slate-400">{formatDistanceToNow(new Date(op.createdAt), { addSuffix: true })}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {operations.length === 0 && <EmptyState title="No recent operations" description="Operations will appear here once created" />}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Low Stock Alerts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {alerts.map((alert) => (
                  <div key={alert.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <div>
                      <p className="text-sm font-medium text-slate-900 dark:text-white">{alert.productName}</p>
                      <p className="text-xs text-slate-400">{alert.productSku}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-500">{alert.currentQty}/{alert.reorderQty}</p>
                      <StockStatusBadge status="low_stock" />
                    </div>
                  </div>
                ))}
              </div>
              {alerts.length === 0 && <EmptyState title="No low stock alerts" description="Everything is healthy" />}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {activity.map((move) => (
                  <div key={move.id} className="border-b border-slate-100 dark:border-slate-800 pb-2 last:border-0">
                    <p className="text-sm text-slate-700 dark:text-slate-300">
                      <span className="font-medium">{move.movedByName}</span> moved <span className="font-medium">{move.qty}</span> {move.uom} of {move.productName}
                    </p>
                    <p className="text-xs text-slate-400">{formatDistanceToNow(new Date(move.movedAt), { addSuffix: true })}</p>
                  </div>
                ))}
              </div>
              {activity.length === 0 && <EmptyState title="No activity yet" description="Stock movements will show here" />}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
