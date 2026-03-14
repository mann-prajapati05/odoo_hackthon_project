import { axiosInstance } from '@/lib/axiosInstance'
import type { Operation, PaginatedResponse, OperationFilters, OperationCounts, OperationTimeline } from '@/types'
import { mapOperation, mapTimeline } from '@/lib/mappers'

const toBackendType = (type: string): string => type.toUpperCase()
const toBackendStatusValue = (status: string): string => status.toUpperCase()
const toBackendStatus = (status?: string): string | undefined => {
  if (!status) return undefined
  return status
    .split(',')
    .map((item) => item.trim().toUpperCase())
    .filter(Boolean)
    .join(',')
}

export type OperationCreatePayload = {
  type: Operation['type']
  warehouseId: string
  supplierName?: string
  destinationName?: string
  fromLocationId?: string
  toLocationId?: string
  scheduledDate?: string
  notes?: string
  status?: 'draft' | 'ready'
  lines?: Array<{
    productId: string
    expectedQty: number
    doneQty?: number
    locationId?: string
    systemQty?: number
    physicalQty?: number
    reason?: string
  }>
}

export const operationsApi = {
  getAll: async (type: string, filters: OperationFilters): Promise<PaginatedResponse<Operation>> => {
    const { data } = await axiosInstance.get('/operations', {
      params: {
        ...filters,
        type: toBackendType(type),
        status: toBackendStatus(filters.status),
      },
    })

    return {
      data: (data.data || []).map((item: Record<string, unknown>) => mapOperation(item)),
      meta: data.meta,
    }
  },

  getById: async (id: string): Promise<Operation> => {
    const { data } = await axiosInstance.get(`/operations/${id}`)
    return mapOperation(data)
  },

  create: async (operation: OperationCreatePayload): Promise<Operation> => {
    const payload = {
      type: toBackendType(operation.type),
      warehouseId: operation.warehouseId,
      supplier: operation.supplierName || undefined,
      destination: operation.destinationName || undefined,
      fromLocationId: operation.fromLocationId || undefined,
      toLocationId: operation.toLocationId || undefined,
      scheduledDate: operation.scheduledDate ? new Date(operation.scheduledDate).toISOString() : undefined,
      notes: operation.notes || undefined,
      status: operation.status ? toBackendStatusValue(operation.status) : undefined,
      lines: operation.lines?.map((line) => ({
        productId: line.productId,
        expectedQty: Number(line.expectedQty),
        doneQty: line.doneQty !== undefined ? Number(line.doneQty) : undefined,
        locationId: line.locationId || undefined,
        systemQty: line.systemQty,
        physicalQty: line.physicalQty,
        reason: line.reason || undefined,
      })),
    }

    const { data } = await axiosInstance.post('/operations', payload)
    return mapOperation(data)
  },

  update: async (id: string, operation: Partial<OperationCreatePayload>): Promise<Operation> => {
    const payload = {
      type: operation.type ? toBackendType(operation.type) : undefined,
      warehouseId: operation.warehouseId,
      supplier: operation.supplierName || undefined,
      destination: operation.destinationName || undefined,
      fromLocationId: operation.fromLocationId || undefined,
      toLocationId: operation.toLocationId || undefined,
      scheduledDate: operation.scheduledDate ? new Date(operation.scheduledDate).toISOString() : undefined,
      notes: operation.notes || undefined,
      status: operation.status ? toBackendStatusValue(operation.status) : undefined,
      lines: operation.lines?.map((line) => ({
        productId: line.productId,
        expectedQty: Number(line.expectedQty),
        doneQty: line.doneQty !== undefined ? Number(line.doneQty) : undefined,
        locationId: line.locationId || undefined,
        systemQty: line.systemQty,
        physicalQty: line.physicalQty,
        reason: line.reason || undefined,
      })),
    }

    const { data } = await axiosInstance.put(`/operations/${id}`, payload)
    return mapOperation(data)
  },

  validate: async (id: string): Promise<{ message: string }> => {
    const { data } = await axiosInstance.post(`/operations/${id}/validate`)
    return data
  },

  cancel: async (id: string): Promise<{ id: string; status: string }> => {
    const { data } = await axiosInstance.post(`/operations/${id}/cancel`, {})
    return data
  },

  duplicate: async (id: string): Promise<Operation> => {
    const { data } = await axiosInstance.post(`/operations/${id}/duplicate`)
    return mapOperation(data)
  },

  getCounts: async (type: string): Promise<OperationCounts> => {
    const { data } = await axiosInstance.get('/operations/counts', {
      params: { type: toBackendType(type) },
    })
    return {
      all: Number(data.total || 0),
      draft: Number(data.DRAFT || 0),
      waiting: Number(data.WAITING || 0),
      ready: Number(data.READY || 0),
      in_progress: Number(data.IN_PROGRESS || 0),
      done: Number(data.DONE || 0),
      cancelled: Number(data.CANCELLED || 0),
    }
  },

  getTimeline: async (id: string): Promise<OperationTimeline[]> => {
    const { data } = await axiosInstance.get(`/operations/${id}/timeline`)
    return (data.data || []).map((item: Record<string, unknown>) => mapTimeline(item))
  },
}
