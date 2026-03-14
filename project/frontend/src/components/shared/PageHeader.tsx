import { cn } from '@/lib/utils'

interface PageHeaderProps {
  title: string
  subtitle?: string
  count?: number
  children?: React.ReactNode
  className?: string
}

export function PageHeader({ title, subtitle, count, children, className }: PageHeaderProps) {
  return (
    <div className={cn('flex items-center justify-between mb-6', className)}>
      <div className="flex items-center gap-3">
        <h1 className="text-page-title text-slate-900 dark:text-white">{title}</h1>
        {count !== undefined && (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            {count.toLocaleString()} {count === 1 ? 'item' : 'items'}
          </span>
        )}
        {subtitle && (
          <span className="text-sm text-slate-500 dark:text-slate-400">{subtitle}</span>
        )}
      </div>
      {children && <div className="flex items-center gap-3">{children}</div>}
    </div>
  )
}
