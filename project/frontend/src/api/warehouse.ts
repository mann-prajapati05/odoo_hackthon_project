import { axiosInstance } from '@/lib/axiosInstance'
import type { Warehouse, Location } from '@/types'

export const warehouseApi = {
  getAll: async (): Promise<Warehouse[]> => {
    const { data } = await axiosInstance.get('/warehouses')
    return data
  },

  getById: async (id: string): Promise<Warehouse> => {
    const { data } = await axiosInstance.get(`/warehouses/${id}`)
    return data
  },

  create: async (warehouse: Partial<Warehouse>): Promise<Warehouse> => {
    const { data } = await axiosInstance.post('/warehouses', warehouse)
    return data
  },

  update: async (id: string, warehouse: Partial<Warehouse>): Promise<Warehouse> => {
    const { data } = await axiosInstance.put(`/warehouses/${id}`, warehouse)
    return data
  },

  delete: async (id: string): Promise<void> => {
    await axiosInstance.delete(`/warehouses/${id}`)
  },

  getLocations: async (warehouseId: string): Promise<Location[]> => {
    const { data } = await axiosInstance.get(`/warehouses/${warehouseId}/locations`)
    return data
  },

  createLocation: async (warehouseId: string, location: Partial<Location>): Promise<Location> => {
    const { data } = await axiosInstance.post(`/warehouses/${warehouseId}/locations`, location)
    return data
  },

  updateLocation: async (warehouseId: string, locationId: string, location: Partial<Location>): Promise<Location> => {
    const { data } = await axiosInstance.put(`/warehouses/${warehouseId}/locations/${locationId}`, location)
    return data
  },

  deleteLocation: async (warehouseId: string, locationId: string): Promise<void> => {
    await axiosInstance.delete(`/warehouses/${warehouseId}/locations/${locationId}`)
  },
}
