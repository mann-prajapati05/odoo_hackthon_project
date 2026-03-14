import { NavLink, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  LayoutDashboard,
  PackageCheck,
  Truck,
  ArrowLeftRight,
  SlidersHorizontal,
  Boxes,
  History,
  Warehouse,
  Settings,
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon,
  LogOut,
} from 'lucide-react'
import { cn, getInitials, getAvatarGradient } from '@/lib/utils'
import { useUIStore, useAuthStore } from '@/store'
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip'
import { Badge } from '@/components/ui/badge'

const navSections = [
  {
    label: 'MAIN',
    items: [
      { label: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
    ],
  },
  {
    label: 'OPERATIONS',
    items: [
      { label: 'Receipts', icon: PackageCheck, href: '/operations/receipts' },
      { label: 'Deliveries', icon: Truck, href: '/operations/deliveries' },
      { label: 'Transfers', icon: ArrowLeftRight, href: '/operations/transfers' },
      { label: 'Adjustments', icon: SlidersHorizontal, href: '/operations/adjustments' },
    ],
  },
  {
    label: 'INVENTORY',
    items: [
      { label: 'Products', icon: Boxes, href: '/products' },
      { label: 'Move History', icon: History, href: '/move-history' },
    ],
  },
  {
    label: 'SETTINGS',
    items: [
      { label: 'Warehouses', icon: Warehouse, href: '/settings/warehouses' },
      { label: 'Settings', icon: Settings, href: '/profile' },
    ],
  },
]

export function Sidebar() {
  const { sidebarCollapsed, toggleSidebar, darkMode, toggleDarkMode } = useUIStore()
  const { user, clearAuth } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = () => {
    clearAuth()
    navigate('/login')
  }

  return (
    <TooltipProvider delayDuration={0}>
      <motion.aside
        initial={false}
        animate={{ width: sidebarCollapsed ? 64 : 240 }}
        transition={{ duration: 0.25, ease: 'easeInOut' }}
        className="fixed left-0 top-0 bottom-0 z-40 flex flex-col bg-slate-900 border-r border-slate-800 overflow-hidden"
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 h-16 border-b border-slate-800 flex-shrink-0">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center flex-shrink-0">
            <Boxes className="w-5 h-5 text-white" />
          </div>
          {!sidebarCollapsed && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-white font-semibold text-base whitespace-nowrap"
            >
              CoreInventory
            </motion.span>
          )}
        </div>

        {/* Nav sections */}
        <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-6">
          {navSections.map((section) => (
            <div key={section.label}>
              {!sidebarCollapsed && (
                <div className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
                  {section.label}
                </div>
              )}
              <div className="space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon
                  return (
                    <Tooltip key={item.href}>
                      <TooltipTrigger asChild>
                        <NavLink
                          to={item.href}
                          className={({ isActive }) =>
                            cn(
                              'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all',
                              sidebarCollapsed && 'justify-center px-0',
                              isActive
                                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
                            )
                          }
                        >
                          <Icon className="w-5 h-5 flex-shrink-0" />
                          {!sidebarCollapsed && (
                            <span className="whitespace-nowrap">{item.label}</span>
                          )}
                        </NavLink>
                      </TooltipTrigger>
                      {sidebarCollapsed && (
                        <TooltipContent side="right">{item.label}</TooltipContent>
                      )}
                    </Tooltip>
                  )
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Collapse toggle */}
        <div className="px-2 pb-2">
          <button
            onClick={toggleSidebar}
            className="w-full flex items-center justify-center rounded-lg py-2 text-slate-400 hover:bg-slate-800 hover:text-slate-100 transition-colors"
          >
            {sidebarCollapsed ? (
              <ChevronRight className="w-5 h-5" />
            ) : (
              <ChevronLeft className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* Bottom section */}
        <div className="border-t border-slate-800 p-3 space-y-3 flex-shrink-0">
          {/* Dark mode toggle */}
          <button
            onClick={toggleDarkMode}
            className={cn(
              'flex items-center gap-3 w-full rounded-lg px-3 py-2 text-sm text-slate-400 hover:bg-slate-800 hover:text-slate-100 transition-colors',
              sidebarCollapsed && 'justify-center px-0'
            )}
          >
            {darkMode ? <Sun className="w-5 h-5 flex-shrink-0" /> : <Moon className="w-5 h-5 flex-shrink-0" />}
            {!sidebarCollapsed && <span>{darkMode ? 'Light Mode' : 'Dark Mode'}</span>}
          </button>

          {/* User info */}
          {user && (
            <div
              className={cn(
                'flex items-center gap-3',
                sidebarCollapsed && 'justify-center'
              )}
            >
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                style={{ background: getAvatarGradient(user.name) }}
              >
                {getInitials(user.name)}
              </div>
              {!sidebarCollapsed && (
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-slate-100 truncate">
                    {user.name}
                  </div>
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-slate-700 text-slate-300 capitalize">
                    {user.role}
                  </Badge>
                </div>
              )}
            </div>
          )}

          {/* Logout */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={handleLogout}
                className={cn(
                  'flex items-center gap-3 w-full rounded-lg px-3 py-2 text-sm text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-colors',
                  sidebarCollapsed && 'justify-center px-0'
                )}
              >
                <LogOut className="w-5 h-5 flex-shrink-0" />
                {!sidebarCollapsed && <span>Log out</span>}
              </button>
            </TooltipTrigger>
            {sidebarCollapsed && <TooltipContent side="right">Log out</TooltipContent>}
          </Tooltip>
        </div>
      </motion.aside>
    </TooltipProvider>
  )
}
