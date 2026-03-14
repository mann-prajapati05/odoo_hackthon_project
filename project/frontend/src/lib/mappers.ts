import type {
  AlertItem,
  MoveHistory,
  Operation,
  OperationTimeline,
  Product,
  StockHistory,
  StockLevel,
  User,
  Warehouse,
  Location,
} from '@/types'

const toOperationType = (value: string): Operation['type'] => {
  const normalized = value.toLowerCase()
  if (normalized === 'receipt' || normalized === 'delivery' || normalized === 'transfer' || normalized === 'adjustment') {
    return normalized
  }
  return 'receipt'
}

const toOperationStatus = (value: string): Operation['status'] => {
  const normalized = value.toLowerCase()
  if (
    normalized === 'draft' ||
    normalized === 'waiting' ||
    normalized === 'ready' ||
    normalized === 'in_progress' ||
    normalized === 'done' ||
    normalized === 'cancelled'
  ) {
    return normalized
  }
  return 'draft'
}

export const mapUser = (raw: Record<string, unknown>): User => ({
  id: String(raw.id),
  name: String(raw.name || ''),
  email: String(raw.email || ''),
  role: String(raw.role || 'STAFF').toLowerCase() as User['role'],
  createdAt: String(raw.createdAt || new Date().toISOString()),
})

export const mapProduct = (raw: Record<string, unknown>): Product => {
  const category = (raw.category || {}) as Record<string, unknown>
  const statusMap: Record<string, Product['stockStatus']> = {
    in: 'in_stock',
    low: 'low_stock',
    out: 'out_of_stock',
  }

  return {
    id: String(raw.id),
    name: String(raw.name || ''),
    sku: String(raw.sku || ''),
    categoryId: String(category.id || ''),
    categoryName: String(category.name || 'Uncategorized'),
    uom: String(raw.uom || ''),
    description: raw.description ? String(raw.description) : undefined,
    imageUrl: raw.imageUrl ? String(raw.imageUrl) : undefined,
    onHand: Number(raw.qtyOnHand || 0),
    reserved: Number(raw.qtyReserved || 0),
    available: Number(raw.qtyAvailable || 0),
    reorderEnabled: Boolean(raw.reorderEnabled),
    minStockLevel: raw.reorderMin !== null && raw.reorderMin !== undefined ? Number(raw.reorderMin) : undefined,
    reorderQty: raw.reorderQty !== null && raw.reorderQty !== undefined ? Number(raw.reorderQty) : undefined,
    stockStatus: statusMap[String(raw.stockStatus || 'in')] || 'in_stock',
    createdBy: '',
    createdByName: '',
    createdAt: String(raw.createdAt || new Date().toISOString()),
    updatedAt: String(raw.updatedAt || new Date().toISOString()),
  }
}

export const mapStockLevel = (raw: Record<string, unknown>): StockLevel => {
  const location = (raw.location || {}) as Record<string, unknown>
  const warehouse = (location.warehouse || {}) as Record<string, unknown>

  return {
    warehouseId: String(warehouse.id || ''),
    warehouseName: String(warehouse.name || ''),
    locationId: String(location.id || ''),
    locationName: String(location.name || ''),
    onHand: Number(raw.qtyOnHand || 0),
    reserved: Number(raw.qtyReserved || 0),
    available: Number(raw.qtyAvailable || 0),
    lastUpdated: String(raw.updatedAt || new Date().toISOString()),
  }
}

export const mapStockHistory = (raw: Record<string, unknown>): StockHistory => ({
  date: String(raw.date || ''),
  qty: Number(raw.qty || 0),
})

export const mapOperation = (raw: Record<string, unknown>): Operation => {
  const warehouse = (raw.warehouse || {}) as Record<string, unknown>
  const createdBy = (raw.createdBy || {}) as Record<string, unknown>
  const validatedBy = (raw.validatedBy || {}) as Record<string, unknown>
  const lines = Array.isArray(raw.lines) ? raw.lines : []

  return {
    id: String(raw.id),
    reference: String(raw.refNumber || ''),
    type: toOperationType(String(raw.type || 'RECEIPT')),
    status: toOperationStatus(String(raw.status || 'DRAFT')),
    supplierName: raw.supplier ? String(raw.supplier) : undefined,
    destinationName: raw.destination ? String(raw.destination) : undefined,
    scheduledDate: raw.scheduledDate ? String(raw.scheduledDate) : '',
    warehouseId: String(warehouse.id || raw.warehouseId || ''),
    warehouseName: String(warehouse.name || ''),
    notes: raw.notes ? String(raw.notes) : undefined,
    lines: lines.map((line) => {
      const product = ((line as Record<string, unknown>).product || {}) as Record<string, unknown>
      const location = ((line as Record<string, unknown>).location || {}) as Record<string, unknown>
      return {
        id: String((line as Record<string, unknown>).id || ''),
        productId: String(product.id || ''),
        productName: String(product.name || ''),
        productSku: String(product.sku || ''),
        uom: String(product.uom || ''),
        expectedQty: Number((line as Record<string, unknown>).expectedQty || 0),
        doneQty: Number((line as Record<string, unknown>).doneQty || 0),
        destinationLocationId: location.id ? String(location.id) : undefined,
        destinationLocationName: location.name ? String(location.name) : undefined,
      }
    }),
    lineCount: Number(((raw._count || {}) as Record<string, unknown>).lines || lines.length),
    createdBy: String(createdBy.id || raw.createdById || ''),
    createdByName: String(createdBy.name || ''),
    createdAt: String(raw.createdAt || new Date().toISOString()),
    validatedBy: validatedBy.id ? String(validatedBy.id) : undefined,
    validatedByName: validatedBy.name ? String(validatedBy.name) : undefined,
    validatedAt: raw.validatedAt ? String(raw.validatedAt) : undefined,
  }
}

export const mapTimeline = (raw: Record<string, unknown>): OperationTimeline => {
  const actor = (raw.actor || {}) as Record<string, unknown>
  return {
    id: String(raw.id),
    action: String(raw.action || ''),
    actorName: String(actor.name || ''),
    status: toOperationStatus(String(raw.toStatus || raw.fromStatus || 'DRAFT')),
    timestamp: String(raw.createdAt || new Date().toISOString()),
  }
}

export const mapMove = (raw: Record<string, unknown>): MoveHistory => {
  const product = (raw.product || {}) as Record<string, unknown>
  const operation = (raw.operation || {}) as Record<string, unknown>
  const fromLocation = (raw.fromLocation || {}) as Record<string, unknown>
  const toLocation = (raw.toLocation || {}) as Record<string, unknown>
  const movedBy = (raw.movedBy || {}) as Record<string, unknown>

  const directionMap: Record<string, MoveHistory['direction']> = {
    in: 'incoming',
    out: 'outgoing',
    internal: 'internal',
    adjustment: 'adjustment',
  }

  return {
    id: String(raw.id),
    operationId: String(operation.id || ''),
    reference: String(operation.refNumber || ''),
    type: toOperationType(String(operation.type || 'RECEIPT')),
    productId: String(product.id || ''),
    productName: String(product.name || ''),
    productSku: String(product.sku || ''),
    fromWarehouse: fromLocation.warehouse ? String(((fromLocation.warehouse as Record<string, unknown>).name || '')) : undefined,
    fromLocation: fromLocation.name ? String(fromLocation.name) : undefined,
    toWarehouse: toLocation.warehouse ? String(((toLocation.warehouse as Record<string, unknown>).name || '')) : undefined,
    toLocation: toLocation.name ? String(toLocation.name) : undefined,
    qty: Number(raw.qty || 0),
    uom: String(product.uom || ''),
    direction: directionMap[String(raw.direction || '').toLowerCase()] || 'internal',
    movedBy: String(movedBy.id || ''),
    movedByName: String(movedBy.name || ''),
    movedAt: String(raw.movedAt || new Date().toISOString()),
  }
}

export const mapWarehouse = (raw: Record<string, unknown>): Warehouse => ({
  id: String(raw.id),
  name: String(raw.name || ''),
  shortCode: String(raw.shortCode || ''),
  address: String(raw.address || ''),
  locationCount: Number((((raw._count || {}) as Record<string, unknown>).locations || 0)),
  productCount: Number((((raw._count || {}) as Record<string, unknown>).operations || 0)),
})

export const flattenLocations = (
  nodes: Array<Record<string, unknown>>,
  warehouseId: string
): Location[] => {
  const out: Location[] = []
  const walk = (items: Array<Record<string, unknown>>) => {
    for (const item of items) {
      out.push({
        id: String(item.id),
        name: String(item.name || ''),
        shortCode: String(item.shortCode || ''),
        warehouseId,
        parentId: item.parentId ? String(item.parentId) : undefined,
      })
      const children = Array.isArray(item.children) ? (item.children as Array<Record<string, unknown>>) : []
      walk(children)
    }
  }
  walk(nodes)
  return out
}

export const mapLowStockAlert = (raw: Record<string, unknown>): AlertItem => ({
  id: String(raw.id),
  productId: String(raw.id),
  productName: String(raw.name || ''),
  productSku: String(raw.sku || ''),
  currentQty: Number(raw.qtyOnHand || 0),
  reorderQty: Number(raw.reorderMin || 0),
  read: false,
})
