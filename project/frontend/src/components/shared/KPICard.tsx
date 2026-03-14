import { motion } from 'framer-motion'
import { type LucideIcon } from 'lucide-react'
import CountUp from 'react-countup'
import { cn } from '@/lib/utils'
import { Card } from '@/components/ui/card'

interface KPICardProps {
  label: string
  value: number
  icon: LucideIcon
  accentColor: string
  linkText?: string
  onLinkClick?: () => void
  className?: string
  previousValue?: number
}

export function KPICard({
  label,
  value,
  icon: Icon,
  accentColor,
  linkText = 'View →',
  onLinkClick,
  className,
  previousValue,
}: KPICardProps) {
  const hasChanged = previousValue !== undefined && previousValue !== value

  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
      className={className}
    >
      <Card
        className={cn(
          'p-6 relative overflow-hidden transition-all',
          hasChanged && 'animate-flash'
        )}
      >
        {/* Left accent border */}
        <div
          className={cn('absolute left-0 top-0 bottom-0 w-1 rounded-l-xl', accentColor)}
        />

        <div className="flex items-start justify-between mb-3">
          <span className="text-table-header uppercase text-slate-500 dark:text-slate-400">
            {label}
          </span>
          <div className={cn('p-2 rounded-lg bg-slate-50 dark:bg-slate-800')}>
            <Icon className="w-5 h-5 text-slate-400" />
          </div>
        </div>

        <div className="mb-2">
          <span className="text-4xl font-bold text-slate-900 dark:text-white tabular-nums">
            <CountUp end={value} duration={1.2} separator="," preserveValue />
          </span>
        </div>

        {onLinkClick && (
          <button
            onClick={onLinkClick}
            className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
          >
            {linkText}
          </button>
        )}
      </Card>
    </motion.div>
  )
}
