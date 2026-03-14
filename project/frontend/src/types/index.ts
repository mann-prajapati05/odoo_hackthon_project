// ============================================================
// User & Auth Types
// ============================================================
export interface User {
  id: string
  name: string
  email: string
  role: 'admin' | 'manager' | 'staff'
  createdAt: string
  lastActive?: string
}

export interface AuthResponse {
  accessToken: string
  user: User
}

export interface LoginPayload {
  email: string
  password: string
}

export interface SignupPayload {
  name: string
  email: string
  password: string
  confirmPassword: string
}

export interface UserStats {
  totalOperations: number
  receiptsValidated: number
  deliveriesCompleted: number
  lastActive: string
}

// ============================================================
// Product Types
// ============================================================
export interface Product {
  id: string
  name: string
  sku: string
  categoryId: string
  categoryName: string
  uom: string
  description?: string
  imageUrl?: string
  onHand: number
  reserved: number
  available: number
  reorderEnabled: boolean
  minStockLevel?: number
  reorderQty?: number
  stockStatus: StockStatus
  createdBy: string
  createdByName: string
  createdAt: string
  updatedAt: string
}

export type StockStatus = 'in_stock' | 'low_stock' | 'out_of_stock'

export interface Category {
  id: string
  name: string
  parentId?: string
  children?: Category[]
}

export interface StockLevel {
  warehouseId: string
  warehouseName: string
  locationId: string
  locationName: string
  onHand: number
  reserved: number
  available: number
  lastUpdated: string
}

export interface StockHistory {
  date: string
  qty: number
}

// ============================================================
// Warehouse & Location Types
// ============================================================
export interface Warehouse {
  id: string
  name: string
  shortCode: string
  address: string
  locationCount: number
  productCount: number
}

export interface Location {
  id: string
  name: string
  shortCode: string
  warehouseId: string
  parentId?: string
  children?: Location[]
  productCount?: number
}

// ============================================================
// Operation Types
// ============================================================
export type OperationType = 'receipt' | 'delivery' | 'transfer' | 'adjustment'
export type OperationStatus = 'draft' | 'waiting' | 'ready' | 'in_progress' | 'done' | 'cancelled'

export interface Operation {
  id: string
  reference: string
  type: OperationType
  status: OperationStatus
  supplierName?: string
  destinationName?: string
  scheduledDate: string
  warehouseId: string
  warehouseName: string
  notes?: string
  lines: OperationLine[]
  lineCount: number
  createdBy: string
  createdByName: string
  createdAt: string
  validatedBy?: string
  validatedByName?: string
  validatedAt?: string
}

export interface OperationLine {
  id: string
  productId: string
  productName: string
  productSku: string
  uom: string
  expectedQty: number
  doneQty: number
  sourceLocationId?: string
  sourceLocationName?: string
  destinationLocationId?: string
  destinationLocationName?: string
  lotBatchNo?: string
  notes?: string
  picked?: boolean
}

export interface OperationCounts {
  all: number
  draft: number
  waiting: number
  ready: number
  in_progress: number
  done: number
  cancelled: number
}

export interface OperationTimeline {
  id: string
  action: string
  actorName: string
  status: OperationStatus
  timestamp: string
}

// ============================================================
// Adjustment-specific Types
// ============================================================
export type AdjustmentType = 'full_count' | 'spot_check' | 'damage_writeoff' | 'found_stock'

export interface AdjustmentLine {
  id: string
  productId: string
  productName: string
  productSku: string
  categoryName: string
  uom: string
  systemQty: number
  physicalCount: number | null
  difference: number | null
  reason?: string
  notes?: string
  status: 'not_counted' | 'counted' | 'discrepancy'
}

export interface AdjustmentDraftState {
  operationId?: string
  adjustmentType: AdjustmentType
  warehouseId: string
  locationId: string
  referenceDate: string
  reason?: string
  lines: AdjustmentLine[]
  lockedAt?: string
  currentStep: number
}

// ============================================================
// Move History Types
// ============================================================
export interface MoveHistory {
  id: string
  operationId: string
  reference: string
  type: OperationType
  productId: string
  productName: string
  productSku: string
  fromWarehouse?: string
  fromLocation?: string
  toWarehouse?: string
  toLocation?: string
  qty: number
  uom: string
  direction: 'incoming' | 'outgoing' | 'internal' | 'adjustment'
  movedBy: string
  movedByName: string
  movedAt: string
}

// ============================================================
// Dashboard Types
// ============================================================
export interface DashboardKPIs {
  totalProducts: number
  lowStockItems: number
  outOfStock: number
  pendingReceipts: number
  pendingDeliveries: number
}

export interface AlertItem {
  id: string
  productId: string
  productName: string
  productSku: string
  currentQty: number
  reorderQty: number
  read: boolean
}

// ============================================================
// Pagination & API Types
// ============================================================
export interface PaginatedResponse<T> {
  data: T[]
  meta: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

export interface ApiError {
  message: string
  statusCode: number
  errors?: Record<string, string[]>
}

// ============================================================
// Filter Types
// ============================================================
export interface ProductFilters {
  search?: string
  categoryId?: string
  stockStatus?: string
  warehouseId?: string
  page?: number
  limit?: number
}

export interface OperationFilters {
  search?: string
  status?: string
  type?: OperationType
  warehouseId?: string
  dateFrom?: string
  dateTo?: string
  page?: number
  limit?: number
}

export interface MoveHistoryFilters {
  productId?: string
  type?: string
  warehouseId?: string
  locationId?: string
  dateFrom?: string
  dateTo?: string
  movedBy?: string
  direction?: string
  page?: number
  limit?: number
}
