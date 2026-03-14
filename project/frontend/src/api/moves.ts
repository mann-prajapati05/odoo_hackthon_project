import { axiosInstance } from '@/lib/axiosInstance'
import type { MoveHistory, PaginatedResponse, MoveHistoryFilters } from '@/types'
import { mapMove } from '@/lib/mappers'

export const movesApi = {
  getAll: async (filters: MoveHistoryFilters): Promise<PaginatedResponse<MoveHistory>> => {
    const { data } = await axiosInstance.get('/move-history', { params: filters })
    return {
      data: (data.data || []).map((item: Record<string, unknown>) => mapMove(item)),
      meta: data.meta,
    }
  },

  getByProduct: async (productId: string, page: number = 1, limit: number = 20): Promise<PaginatedResponse<MoveHistory>> => {
    return movesApi.getAll({ productId, page, limit })
  },

  getRecent: async (limit: number = 6): Promise<MoveHistory[]> => {
    const { data } = await axiosInstance.get('/move-history', { params: { limit } })
    return (data.data || []).map((item: Record<string, unknown>) => mapMove(item))
  },

  exportCsv: async (filters: MoveHistoryFilters): Promise<Blob> => {
    const { data } = await axiosInstance.get('/move-history', {
      params: { ...filters, format: 'csv' },
      responseType: 'blob',
    })
    return data
  },
}
