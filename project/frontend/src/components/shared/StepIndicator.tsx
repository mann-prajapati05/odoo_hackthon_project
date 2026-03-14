import { cn } from '@/lib/utils'
import { Check } from 'lucide-react'

interface Step {
  label: string
  description?: string
}

interface StepIndicatorProps {
  steps: Step[]
  currentStep: number
  className?: string
}

export function StepIndicator({ steps, currentStep, className }: StepIndicatorProps) {
  return (
    <div className={cn('flex items-center w-full', className)}>
      {steps.map((step, index) => {
        const isCompleted = index < currentStep
        const isCurrent = index === currentStep
        const isLast = index === steps.length - 1

        return (
          <div key={index} className={cn('flex items-center', !isLast && 'flex-1')}>
            {/* Step circle */}
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all',
                  isCompleted && 'bg-indigo-600 border-indigo-600 text-white',
                  isCurrent && 'border-indigo-600 text-indigo-600 ring-4 ring-indigo-100 dark:ring-indigo-900/30',
                  !isCompleted && !isCurrent && 'border-slate-300 text-slate-400 dark:border-slate-600'
                )}
              >
                {isCompleted ? (
                  <Check className="w-5 h-5" />
                ) : (
                  <span className="text-sm font-semibold">{index + 1}</span>
                )}
              </div>
              <span
                className={cn(
                  'mt-2 text-xs font-medium text-center whitespace-nowrap',
                  isCurrent ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500'
                )}
              >
                {step.label}
              </span>
            </div>

            {/* Connector line */}
            {!isLast && (
              <div className="flex-1 mx-3 mt-[-20px]">
                <div
                  className={cn(
                    'h-0.5 w-full transition-colors',
                    isCompleted ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-700'
                  )}
                />
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
