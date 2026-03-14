import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description?: string
  actionLabel?: string
  onAction?: () => void
  className?: string
}

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  className,
}: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-16 px-4', className)}>
      {icon || (
        <svg
          className="w-24 h-24 text-slate-200 dark:text-slate-700 mb-4"
          viewBox="0 0 120 120"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect x="20" y="30" width="80" height="60" rx="8" stroke="currentColor" strokeWidth="2" />
          <path d="M20 50h80" stroke="currentColor" strokeWidth="2" />
          <circle cx="35" cy="40" r="4" fill="currentColor" opacity="0.5" />
          <circle cx="50" cy="40" r="4" fill="currentColor" opacity="0.3" />
          <rect x="35" y="60" width="50" height="6" rx="3" fill="currentColor" opacity="0.2" />
          <rect x="35" y="72" width="35" height="6" rx="3" fill="currentColor" opacity="0.15" />
        </svg>
      )}
      <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-1">
        {title}
      </h3>
      {description && (
        <p className="text-sm text-slate-400 dark:text-slate-500 text-center max-w-sm mb-4">
          {description}
        </p>
      )}
      {actionLabel && onAction && (
        <Button onClick={onAction} className="mt-2">
          {actionLabel}
        </Button>
      )}
    </div>
  )
}
