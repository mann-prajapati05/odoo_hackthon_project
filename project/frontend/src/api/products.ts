import { axiosInstance } from '@/lib/axiosInstance'
import type { Product, PaginatedResponse, ProductFilters, StockLevel, StockHistory, Category } from '@/types'

export const productsApi = {
  getAll: async (filters: ProductFilters): Promise<PaginatedResponse<Product>> => {
    const { data } = await axiosInstance.get('/products', { params: filters })
    return data
  },

  getById: async (id: string): Promise<Product> => {
    const { data } = await axiosInstance.get(`/products/${id}`)
    return data
  },

  create: async (product: Partial<Product>): Promise<Product> => {
    const { data } = await axiosInstance.post('/products', product)
    return data
  },

  update: async (id: string, product: Partial<Product>): Promise<Product> => {
    const { data } = await axiosInstance.put(`/products/${id}`, product)
    return data
  },

  delete: async (id: string): Promise<void> => {
    await axiosInstance.delete(`/products/${id}`)
  },

  deleteMany: async (ids: string[]): Promise<void> => {
    await axiosInstance.post('/products/delete-many', { ids })
  },

  getStockLevels: async (productId: string): Promise<StockLevel[]> => {
    const { data } = await axiosInstance.get(`/products/${productId}/stock`)
    return data
  },

  getStockAtLocation: async (productId: string, locationId: string): Promise<{ available: number }> => {
    const { data } = await axiosInstance.get(`/products/${productId}/stock`, { params: { locationId } })
    return data
  },

  getStockHistory: async (productId: string, days: number = 30): Promise<StockHistory[]> => {
    const { data } = await axiosInstance.get(`/products/${productId}/stock-history`, { params: { days } })
    return data
  },

  importProducts: async (file: File): Promise<{ preview: unknown[] }> => {
    const formData = new FormData()
    formData.append('file', file)
    const { data } = await axiosInstance.post('/products/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return data
  },

  exportCsv: async (filters: ProductFilters): Promise<Blob> => {
    const { data } = await axiosInstance.get('/products/export', {
      params: filters,
      responseType: 'blob',
    })
    return data
  },

  getCategories: async (search?: string): Promise<Category[]> => {
    const { data } = await axiosInstance.get('/categories', { params: { search } })
    return data
  },
}
