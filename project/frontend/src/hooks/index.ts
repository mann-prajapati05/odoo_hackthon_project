import { useState, useEffect, useRef, useCallback } from 'react'

// ============================================================
// useDebounce
// ============================================================
export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])

  return debouncedValue
}

// ============================================================
// useRealTimeClock
// ============================================================
export function useRealTimeClock() {
  const [time, setTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const formatted = time.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  })

  return { time, formatted }
}

// ============================================================
// useKPIPolling
// ============================================================
export function useKPIPolling(interval: number = 90000) {
  const [lastRefetch, setLastRefetch] = useState(Date.now())

  useEffect(() => {
    const timer = setInterval(() => {
      setLastRefetch(Date.now())
    }, interval)
    return () => clearInterval(timer)
  }, [interval])

  return lastRefetch
}

// ============================================================
// useBarcodeInput
// ============================================================
export function useBarcodeInput(onScan: (barcode: string) => void) {
  const bufferRef = useRef('')
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return

      if (timeoutRef.current) clearTimeout(timeoutRef.current)

      if (e.key === 'Enter' && bufferRef.current.length > 3) {
        onScan(bufferRef.current)
        bufferRef.current = ''
        return
      }

      if (e.key.length === 1) {
        bufferRef.current += e.key
      }

      timeoutRef.current = setTimeout(() => {
        bufferRef.current = ''
      }, 100)
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onScan])
}

// ============================================================
// useStockAlert
// ============================================================
export function useStockAlert(currentQty: number, reorderQty: number) {
  if (currentQty === 0) return { status: 'out_of_stock' as const, severity: 'critical' }
  if (currentQty <= reorderQty) return { status: 'low_stock' as const, severity: 'warning' }
  return { status: 'in_stock' as const, severity: 'normal' }
}

// ============================================================
// useOperationMachine (simplified state machine for operation workflow)
// ============================================================
type OperationAction = 'save_draft' | 'mark_ready' | 'validate' | 'cancel' | 'start_picking' | 'revert'

export function useOperationMachine(initialStatus: string = 'draft') {
  const [status, setStatus] = useState(initialStatus)

  const transitions: Record<string, Record<string, string>> = {
    draft: { mark_ready: 'ready', cancel: 'cancelled' },
    waiting: { mark_ready: 'ready', cancel: 'cancelled', revert: 'draft' },
    ready: { validate: 'done', cancel: 'cancelled', revert: 'draft', start_picking: 'in_progress' },
    in_progress: { validate: 'done', cancel: 'cancelled' },
  }

  const can = useCallback(
    (action: OperationAction) => {
      return !!transitions[status]?.[action]
    },
    [status]
  )

  const transition = useCallback(
    (action: OperationAction) => {
      const next = transitions[status]?.[action]
      if (next) setStatus(next)
      return next
    },
    [status]
  )

  return { status, setStatus, can, transition }
}

// ============================================================
// useLocalStorage
// ============================================================
export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((prev: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key)
      return item ? JSON.parse(item) : initialValue
    } catch {
      return initialValue
    }
  })

  const setValue = (value: T | ((prev: T) => T)) => {
    const valueToStore = value instanceof Function ? value(storedValue) : value
    setStoredValue(valueToStore)
    window.localStorage.setItem(key, JSON.stringify(valueToStore))
  }

  return [storedValue, setValue]
}
