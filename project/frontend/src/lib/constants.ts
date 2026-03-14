// Route paths
export const ROUTES = {
  LOGIN: '/login',
  SIGNUP: '/signup',
  FORGOT_PASSWORD: '/forgot-password',
  DASHBOARD: '/dashboard',
  PRODUCTS: '/products',
  PRODUCT_DETAIL: '/products/:id',
  RECEIPTS: '/operations/receipts',
  RECEIPT_NEW: '/operations/receipts/new',
  RECEIPT_DETAIL: '/operations/receipts/:id',
  RECEIPT_EDIT: '/operations/receipts/:id/edit',
  DELIVERIES: '/operations/deliveries',
  DELIVERY_NEW: '/operations/deliveries/new',
  DELIVERY_DETAIL: '/operations/deliveries/:id',
  DELIVERY_EDIT: '/operations/deliveries/:id/edit',
  TRANSFERS: '/operations/transfers',
  TRANSFER_NEW: '/operations/transfers/new',
  TRANSFER_DETAIL: '/operations/transfers/:id',
  ADJUSTMENTS: '/operations/adjustments',
  ADJUSTMENT_NEW: '/operations/adjustments/new',
  ADJUSTMENT_DETAIL: '/operations/adjustments/:id',
  MOVE_HISTORY: '/move-history',
  WAREHOUSES: '/settings/warehouses',
  PROFILE: '/profile',
} as const

// Query keys
export const QUERY_KEYS = {
  PRODUCTS: 'products',
  PRODUCT: 'product',
  CATEGORIES: 'categories',
  OPERATIONS: 'operations',
  OPERATION: 'operation',
  OPERATION_COUNTS: 'operation-counts',
  DASHBOARD_KPIS: 'dashboard-kpis',
  MOVE_HISTORY: 'move-history',
  WAREHOUSES: 'warehouses',
  LOCATIONS: 'locations',
  STOCK_LEVELS: 'stock-levels',
  USER: 'user',
  USER_STATS: 'user-stats',
  ALERTS: 'alerts',
} as const

// Status badge config
export const STATUS_BADGE_CONFIG: Record<string, { bg: string; text: string; dot?: string }> = {
  draft: { bg: 'bg-slate-100 dark:bg-slate-800', text: 'text-slate-600 dark:text-slate-300' },
  waiting: { bg: 'bg-amber-50 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-300' },
  ready: { bg: 'bg-sky-50 dark:bg-sky-900/30', text: 'text-sky-700 dark:text-sky-300' },
  in_progress: { bg: 'bg-blue-50 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-300' },
  done: { bg: 'bg-emerald-50 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-300' },
  cancelled: { bg: 'bg-red-50 dark:bg-red-900/30', text: 'text-red-600 dark:text-red-300' },
}

export const OPERATION_TYPE_COLORS: Record<string, string> = {
  receipt: 'bg-teal-50 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300',
  delivery: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300',
  transfer: 'bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  adjustment: 'bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
}

export const STOCK_STATUS_CONFIG = {
  in_stock: { label: 'In Stock', color: 'text-emerald-600', dot: 'bg-emerald-500' },
  low_stock: { label: 'Low Stock', color: 'text-amber-600', dot: 'bg-amber-500 animate-pulse-dot' },
  out_of_stock: { label: 'Out of Stock', color: 'text-red-600', dot: 'bg-red-500' },
}

export const UOM_OPTIONS = [
  { value: 'pcs', label: 'Pieces' },
  { value: 'kg', label: 'Kilograms' },
  { value: 'litre', label: 'Litres' },
  { value: 'box', label: 'Boxes' },
  { value: 'metre', label: 'Metres' },
  { value: 'dozen', label: 'Dozens' },
  { value: 'set', label: 'Sets' },
  { value: 'pair', label: 'Pairs' },
]

export const ADJUSTMENT_REASONS = [
  { value: 'damaged', label: 'Damaged' },
  { value: 'expired', label: 'Expired' },
  { value: 'theft', label: 'Theft' },
  { value: 'data_entry_error', label: 'Data entry error' },
  { value: 'wrong_location', label: 'Found in wrong location' },
  { value: 'other', label: 'Other' },
]

export const KEYBOARD_SHORTCUTS = [
  { keys: ['Ctrl', 'K'], description: 'Open command palette' },
  { keys: ['N', 'R'], description: 'New Receipt (on Receipts page)' },
  { keys: ['N', 'D'], description: 'New Delivery (on Deliveries page)' },
  { keys: ['N', 'T'], description: 'New Transfer (on Transfers page)' },
  { keys: ['N', 'A'], description: 'New Adjustment (on Adjustments page)' },
  { keys: ['/'], description: 'Focus search input' },
  { keys: ['Escape'], description: 'Close modal / drawer' },
  { keys: ['?'], description: 'Show keyboard shortcuts' },
]
