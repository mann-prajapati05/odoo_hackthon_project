import { axiosInstance } from '@/lib/axiosInstance'
import type { DashboardKPIs, Operation, AlertItem, MoveHistory } from '@/types'

export const dashboardApi = {
  getKPIs: async (): Promise<DashboardKPIs> => {
    const { data } = await axiosInstance.get('/dashboard/kpis')
    return data
  },

  getRecentOperations: async (limit: number = 10): Promise<Operation[]> => {
    const { data } = await axiosInstance.get('/operations', {
      params: { limit, sort: 'createdAt:desc' },
    })
    return data.data || data
  },

  getLowStockAlerts: async (limit: number = 8): Promise<AlertItem[]> => {
    const { data } = await axiosInstance.get('/products', {
      params: { stockStatus: 'low_stock', limit },
    })
    return data.data || data
  },

  getRecentMoves: async (limit: number = 6): Promise<MoveHistory[]> => {
    const { data } = await axiosInstance.get('/move-history', {
      params: { limit, sort: 'movedAt:desc' },
    })
    return data.data || data
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
