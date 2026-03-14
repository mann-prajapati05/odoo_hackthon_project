import { axiosInstance } from '@/lib/axiosInstance'
import type { MoveHistory, PaginatedResponse, MoveHistoryFilters } from '@/types'

export const movesApi = {
  getAll: async (filters: MoveHistoryFilters): Promise<PaginatedResponse<MoveHistory>> => {
    const { data } = await axiosInstance.get('/move-history', { params: filters })
    return data
  },

  getByProduct: async (productId: string, page: number = 1, limit: number = 20): Promise<PaginatedResponse<MoveHistory>> => {
    const { data } = await axiosInstance.get('/move-history', { params: { productId, page, limit, sort: 'movedAt:desc' } })
    return data
  },

  getRecent: async (limit: number = 6): Promise<MoveHistory[]> => {
    const { data } = await axiosInstance.get('/move-history', { params: { limit, sort: 'movedAt:desc' } })
    return data.data || data
  },

  exportCsv: async (filters: MoveHistoryFilters): Promise<Blob> => {
    const { data } = await axiosInstance.get('/move-history/export', {
      params: filters,
      responseType: 'blob',
    })
    return data
  },
}
