import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  Search,
  Bell,
  Clock,
  ChevronRight,
  User,
  Lock,
  LogOut,
} from 'lucide-react'
import { cn, getInitials, getAvatarGradient } from '@/lib/utils'
import { useUIStore, useAuthStore, useNotificationStore } from '@/store'
import { useRealTimeClock } from '@/hooks'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export function TopHeader() {
  const { pageTitle, breadcrumbs, sidebarCollapsed, setCommandPaletteOpen } = useUIStore()
  const { user, clearAuth } = useAuthStore()
  const { unreadCount } = useNotificationStore()
  const { formatted } = useRealTimeClock()
  const navigate = useNavigate()
  const [notifOpen, setNotifOpen] = useState(false)

  const handleLogout = () => {
    clearAuth()
    navigate('/login')
  }

  return (
    <header
      className={cn(
        'sticky top-0 z-30 h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between px-6 transition-all',
        sidebarCollapsed ? 'ml-16' : 'ml-60'
      )}
    >
      {/* Left — Title + Breadcrumbs */}
      <div className="flex items-center gap-2">
        {breadcrumbs.length > 0 ? (
          <nav className="flex items-center gap-1.5 text-sm">
            {breadcrumbs.map((crumb, i) => (
              <span key={i} className="flex items-center gap-1.5">
                {i > 0 && <ChevronRight className="w-3.5 h-3.5 text-slate-400" />}
                {crumb.href ? (
                  <Link
                    to={crumb.href}
                    className="text-slate-500 hover:text-indigo-600 transition-colors"
                  >
                    {crumb.label}
                  </Link>
                ) : (
                  <span className="text-slate-900 dark:text-slate-100 font-semibold">
                    {crumb.label}
                  </span>
                )}
              </span>
            ))}
          </nav>
        ) : (
          <h1 className="text-page-title text-slate-900 dark:text-slate-100">
            {pageTitle}
          </h1>
        )}
      </div>

      {/* Right section */}
      <div className="flex items-center gap-3">
        {/* Live Clock */}
        <div className="hidden md:flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
          <Clock className="w-4 h-4" />
          <span className="font-mono text-sm tabular-nums">{formatted}</span>
        </div>

        {/* Search / Command Palette */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCommandPaletteOpen(true)}
          className="hidden sm:flex gap-2 text-slate-500"
        >
          <Search className="w-4 h-4" />
          <span className="text-xs">Search</span>
          <kbd className="ml-2 pointer-events-none hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
            Ctrl+K
          </kbd>
        </Button>

        {/* Notification Bell */}
        <div className="relative">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setNotifOpen(!notifOpen)}
            className="relative"
          >
            <Bell className="w-5 h-5 text-slate-500" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </Button>
          {notifOpen && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg overflow-hidden z-50">
              <div className="p-3 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
                <span className="font-semibold text-sm text-slate-900 dark:text-slate-100">Notifications</span>
                <button
                  onClick={() => {
                    useNotificationStore.getState().markAllRead()
                    setNotifOpen(false)
                  }}
                  className="text-xs text-indigo-600 hover:underline"
                >
                  Mark all read
                </button>
              </div>
              <div className="max-h-64 overflow-y-auto p-2">
                <p className="text-sm text-slate-500 text-center py-6">No new notifications</p>
              </div>
            </div>
          )}
        </div>

        {/* User Avatar Dropdown */}
        {user && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 focus:outline-none">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold cursor-pointer hover:ring-2 hover:ring-indigo-400 transition-all"
                  style={{ background: getAvatarGradient(user.name) }}
                >
                  {getInitials(user.name)}
                </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <div className="px-2 py-1.5">
                <p className="text-sm font-medium">{user.name}</p>
                <p className="text-xs text-slate-500">{user.email}</p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate('/profile')}>
                <User className="w-4 h-4 mr-2" />
                My Profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/profile')}>
                <Lock className="w-4 h-4 mr-2" />
                Change Password
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-red-600 dark:text-red-400">
                <LogOut className="w-4 h-4 mr-2" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </header>
  )
}
