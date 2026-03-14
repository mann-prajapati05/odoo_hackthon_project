import { axiosInstance } from '@/lib/axiosInstance'
import type { DashboardKPIs, Operation, AlertItem, MoveHistory } from '@/types'
import { mapLowStockAlert, mapMove, mapOperation } from '@/lib/mappers'

export const dashboardApi = {
  getKPIs: async (): Promise<DashboardKPIs> => {
    const { data } = await axiosInstance.get('/dashboard/kpis')
    return {
      totalProducts: Number(data.totalProducts || 0),
      lowStockItems: Number(data.lowStockItems || 0),
      outOfStock: Number(data.outOfStockItems || 0),
      pendingReceipts: Number(data.pendingReceipts || 0),
      pendingDeliveries: Number(data.pendingDeliveries || 0),
    }
  },

  getRecentOperations: async (limit: number = 10): Promise<Operation[]> => {
    const { data } = await axiosInstance.get('/operations', {
      params: { limit, sortBy: 'createdAt', sortDir: 'desc' },
    })
    return (data.data || []).map((item: Record<string, unknown>) => mapOperation(item))
  },

  getLowStockAlerts: async (limit: number = 8): Promise<AlertItem[]> => {
    const { data } = await axiosInstance.get('/dashboard/low-stock', { params: { limit } })
    return (data.data || []).map((item: Record<string, unknown>) => mapLowStockAlert(item))
  },

  getRecentMoves: async (limit: number = 6): Promise<MoveHistory[]> => {
    const { data } = await axiosInstance.get('/dashboard/recent-activity', { params: { limit } })
    return (data.data || []).map((item: Record<string, unknown>) => mapMove(item))
  },

  uploadFile: async (file: File): Promise<{ url: string }> => {
    const formData = new FormData()
    formData.append('file', file)
    const { data } = await axiosInstance.post('/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return data
  },
}
