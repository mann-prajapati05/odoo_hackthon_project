import { axiosInstance } from '@/lib/axiosInstance'
import type { Product, PaginatedResponse, ProductFilters, StockLevel, StockHistory, Category } from '@/types'
import { mapProduct, mapStockHistory, mapStockLevel } from '@/lib/mappers'

export type ProductCreatePayload = {
  name: string
  sku: string
  categoryId?: string
  uom: string
  description?: string
  reorderEnabled?: boolean
  minStockLevel?: number
  reorderQty?: number
  initialQty?: number
  locationId?: string
}

export const productsApi = {
  getAll: async (filters: ProductFilters): Promise<PaginatedResponse<Product>> => {
    const backendFilters = {
      ...filters,
      stockStatus:
        filters.stockStatus === 'low_stock'
          ? 'low'
          : filters.stockStatus === 'out_of_stock'
            ? 'out'
            : filters.stockStatus === 'in_stock'
              ? 'in'
              : undefined,
    }

    const { data } = await axiosInstance.get('/products', { params: backendFilters })
    return {
      data: (data.data || []).map((item: Record<string, unknown>) => mapProduct(item)),
      meta: data.meta,
    }
  },

  getById: async (id: string): Promise<Product> => {
    const { data } = await axiosInstance.get(`/products/${id}`)
    return mapProduct(data)
  },

  create: async (product: ProductCreatePayload): Promise<Product> => {
    const payload = {
      name: product.name,
      sku: product.sku,
      categoryId: product.categoryId || undefined,
      uom: product.uom,
      description: product.description || undefined,
      reorderEnabled: Boolean(product.reorderEnabled),
      reorderMin: product.minStockLevel,
      reorderQty: product.reorderQty,
      initialQty: product.initialQty,
      initialLocationId: product.locationId,
    }

    const { data } = await axiosInstance.post('/products', payload)
    return mapProduct(data)
  },

  update: async (id: string, product: Partial<ProductCreatePayload>): Promise<Product> => {
    const payload = {
      name: product.name,
      sku: product.sku,
      categoryId: product.categoryId || undefined,
      uom: product.uom,
      description: product.description || undefined,
      reorderEnabled: product.reorderEnabled,
      reorderMin: product.minStockLevel,
      reorderQty: product.reorderQty,
    }

    const { data } = await axiosInstance.put(`/products/${id}`, payload)
    return mapProduct(data)
  },

  delete: async (id: string): Promise<void> => {
    await axiosInstance.delete(`/products/${id}`)
  },

  getStockLevels: async (productId: string): Promise<StockLevel[]> => {
    const { data } = await axiosInstance.get(`/products/${productId}/stock`)
    return (data.data || []).map((item: Record<string, unknown>) => mapStockLevel(item))
  },

  getStockAtLocation: async (productId: string, locationId: string): Promise<{ available: number }> => {
    const { data } = await axiosInstance.get(`/products/${productId}/stock`, { params: { locationId } })
    const first = Array.isArray(data.data) ? data.data[0] : null
    return { available: Number(first?.qtyAvailable || 0) }
  },

  getStockHistory: async (productId: string, days: number = 30): Promise<StockHistory[]> => {
    const { data } = await axiosInstance.get(`/products/${productId}/stock-history`, { params: { days } })
    return (data.data || []).map((item: Record<string, unknown>) => mapStockHistory(item))
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
    return data.data || []
  },
}
