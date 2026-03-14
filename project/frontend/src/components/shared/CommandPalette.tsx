import { useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Command } from 'cmdk'
import {
  LayoutDashboard,
  Boxes,
  PackageCheck,
  Truck,
  ArrowLeftRight,
  SlidersHorizontal,
  History,
  Warehouse,
  Settings,
  Plus,
  Search,
} from 'lucide-react'
import { useUIStore } from '@/store'

const groups = [
  {
    heading: 'Navigation',
    items: [
      { icon: LayoutDashboard, label: 'Dashboard', shortcut: '⌘1', to: '/dashboard' },
      { icon: Boxes, label: 'Products', shortcut: '⌘2', to: '/products' },
      { icon: PackageCheck, label: 'Receipts', to: '/operations/receipts' },
      { icon: Truck, label: 'Deliveries', to: '/operations/deliveries' },
      { icon: ArrowLeftRight, label: 'Transfers', to: '/operations/transfers' },
      { icon: SlidersHorizontal, label: 'Adjustments', to: '/operations/adjustments' },
      { icon: History, label: 'Move History', to: '/move-history' },
      { icon: Warehouse, label: 'Warehouses', to: '/settings/warehouses' },
      { icon: Settings, label: 'Settings', to: '/profile' },
    ],
  },
  {
    heading: 'Actions',
    items: [
      { icon: Plus, label: 'New Product', to: '/products/new' },
      { icon: Plus, label: 'New Receipt', to: '/operations/receipts/new' },
      { icon: Plus, label: 'New Delivery', to: '/operations/deliveries/new' },
      { icon: Plus, label: 'New Transfer', to: '/operations/transfers/new' },
    ],
  },
]

export function CommandPalette() {
  const { commandPaletteOpen, setCommandPaletteOpen } = useUIStore()
  const navigate = useNavigate()

  // Global keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        setCommandPaletteOpen(!commandPaletteOpen)
      }
      if (e.key === 'Escape') {
        setCommandPaletteOpen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [commandPaletteOpen, setCommandPaletteOpen])

  const handleSelect = useCallback(
    (to: string) => {
      setCommandPaletteOpen(false)
      navigate(to)
    },
    [navigate, setCommandPaletteOpen]
  )

  if (!commandPaletteOpen) return null

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
        onClick={() => setCommandPaletteOpen(false)}
      />

      {/* Palette */}
      <div className="fixed inset-x-0 top-[20vh] z-50 mx-auto w-full max-w-lg px-4">
        <Command className="rounded-xl border bg-white shadow-2xl dark:bg-slate-900 dark:border-slate-700 overflow-hidden">
          <div className="flex items-center gap-2 border-b px-3">
            <Search className="w-4 h-4 text-slate-400" />
            <Command.Input
              placeholder="Type a command or search..."
              className="flex h-12 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-slate-400 disabled:cursor-not-allowed disabled:opacity-50"
              autoFocus
            />
            <kbd className="pointer-events-none h-5 select-none rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-slate-400">
              ESC
            </kbd>
          </div>
          <Command.List className="max-h-80 overflow-y-auto p-2">
            <Command.Empty className="py-6 text-center text-sm text-slate-500">
              No results found.
            </Command.Empty>
            {groups.map((group) => (
              <Command.Group key={group.heading} heading={group.heading} className="px-1 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                {group.items.map((item) => {
                  const Icon = item.icon
                  return (
                    <Command.Item
                      key={item.to}
                      value={item.label}
                      onSelect={() => handleSelect(item.to)}
                      className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-700 dark:text-slate-300 cursor-pointer data-[selected=true]:bg-indigo-50 data-[selected=true]:text-indigo-600 dark:data-[selected=true]:bg-indigo-900/20"
                    >
                      <Icon className="w-4 h-4" />
                      <span className="flex-1">{item.label}</span>
                      {item.shortcut && (
                        <kbd className="text-[10px] font-mono text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                          {item.shortcut}
                        </kbd>
                      )}
                    </Command.Item>
                  )
                })}
              </Command.Group>
            ))}
          </Command.List>
        </Command>
      </div>
    </>
  )
}
