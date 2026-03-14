import { cn } from '@/lib/utils'
import { STATUS_BADGE_CONFIG, OPERATION_TYPE_COLORS, STOCK_STATUS_CONFIG } from '@/lib/constants'

interface StatusBadgeProps {
  status: string
  className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = STATUS_BADGE_CONFIG[status] || STATUS_BADGE_CONFIG['draft']
  const label = status.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium capitalize',
        config?.bg,
        config?.text,
        className
      )}
    >
      {label}
    </span>
  )
}

interface OperationTypeBadgeProps {
  type: string
  className?: string
}

export function OperationTypeBadge({ type, className }: OperationTypeBadgeProps) {
  const color = OPERATION_TYPE_COLORS[type] || OPERATION_TYPE_COLORS['receipt']
  const label = type.charAt(0).toUpperCase() + type.slice(1)

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium',
        color,
        className
      )}
    >
      {label}
    </span>
  )
}

interface StockStatusBadgeProps {
  status: string
  className?: string
}

export function StockStatusBadge({ status, className }: StockStatusBadgeProps) {
  const config = STOCK_STATUS_CONFIG[status as keyof typeof STOCK_STATUS_CONFIG] || STOCK_STATUS_CONFIG['in_stock']

  return (
    <span className={cn('inline-flex items-center gap-1.5 text-xs font-medium', config.color, className)}>
      <span className={cn('w-2 h-2 rounded-full', config.dot)} />
      {config.label}
    </span>
  )
}
