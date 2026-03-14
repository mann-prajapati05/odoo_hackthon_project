import { axiosInstance } from '@/lib/axiosInstance'
import type { Warehouse, Location } from '@/types'
import { flattenLocations, mapWarehouse } from '@/lib/mappers'

export const warehouseApi = {
  getAll: async (): Promise<Warehouse[]> => {
    const { data } = await axiosInstance.get('/warehouses')
    return (data.data || []).map((item: Record<string, unknown>) => mapWarehouse(item))
  },

  getById: async (id: string): Promise<Warehouse> => {
    const { data } = await axiosInstance.get(`/warehouses/${id}`)
    return {
      id: String(data.id),
      name: String(data.name || ''),
      shortCode: String(data.shortCode || ''),
      address: String(data.address || ''),
      locationCount: Array.isArray(data.locations) ? data.locations.length : 0,
      productCount: 0,
    }
  },

  create: async (warehouse: Partial<Warehouse>): Promise<Warehouse> => {
    const { data } = await axiosInstance.post('/warehouses', warehouse)
    return mapWarehouse(data)
  },

  update: async (id: string, warehouse: Partial<Warehouse>): Promise<Warehouse> => {
    const { data } = await axiosInstance.put(`/warehouses/${id}`, warehouse)
    return mapWarehouse(data)
  },

  delete: async (id: string): Promise<void> => {
    await axiosInstance.delete(`/warehouses/${id}`)
  },

  getLocations: async (warehouseId: string): Promise<Location[]> => {
    const { data } = await axiosInstance.get(`/warehouses/${warehouseId}/locations`, { params: { flat: true } })
    const nodes = (data.data || []) as Array<Record<string, unknown>>
    return flattenLocations(nodes, warehouseId)
  },

  createLocation: async (warehouseId: string, location: Partial<Location>): Promise<Location> => {
    const { data } = await axiosInstance.post(`/warehouses/${warehouseId}/locations`, location)
    return data
  },

  updateLocation: async (warehouseId: string, locationId: string, location: Partial<Location>): Promise<Location> => {
    const { data } = await axiosInstance.put(`/locations/${locationId}`, location)
    return data
  },

  deleteLocation: async (warehouseId: string, locationId: string): Promise<void> => {
    await axiosInstance.delete(`/locations/${locationId}`)
  },
}
