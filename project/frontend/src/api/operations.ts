import { axiosInstance } from '@/lib/axiosInstance'
import type { Operation, PaginatedResponse, OperationFilters, OperationCounts, OperationTimeline } from '@/types'

export const operationsApi = {
  getAll: async (type: string, filters: OperationFilters): Promise<PaginatedResponse<Operation>> => {
    const { data } = await axiosInstance.get(`/operations`, { params: { ...filters, type } })
    return data
  },

  getById: async (id: string): Promise<Operation> => {
    const { data } = await axiosInstance.get(`/operations/${id}`)
    return data
  },

  create: async (operation: Partial<Operation>): Promise<Operation> => {
    const { data } = await axiosInstance.post('/operations', operation)
    return data
  },

  update: async (id: string, operation: Partial<Operation>): Promise<Operation> => {
    const { data } = await axiosInstance.put(`/operations/${id}`, operation)
    return data
  },

  validate: async (id: string): Promise<Operation> => {
    const { data } = await axiosInstance.post(`/operations/${id}/validate`)
    return data
  },

  cancel: async (id: string): Promise<Operation> => {
    const { data } = await axiosInstance.post(`/operations/${id}/cancel`)
    return data
  },

  duplicate: async (id: string): Promise<Operation> => {
    const { data } = await axiosInstance.post(`/operations/${id}/duplicate`)
    return data
  },

  getCounts: async (type: string): Promise<OperationCounts> => {
    const { data } = await axiosInstance.get('/operations/counts', { params: { type } })
    return data
  },

  getTimeline: async (id: string): Promise<OperationTimeline[]> => {
    const { data } = await axiosInstance.get(`/operations/${id}/timeline`)
    return data
  },

  startPicking: async (id: string): Promise<Operation> => {
    const { data } = await axiosInstance.post(`/operations/${id}/start-picking`)
    return data
  },
}
