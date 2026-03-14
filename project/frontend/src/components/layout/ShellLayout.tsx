import { Outlet } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useUIStore } from '@/store'
import { Sidebar } from './Sidebar'
import { TopHeader } from './TopHeader'
import { cn } from '@/lib/utils'

export function ShellLayout() {
  const { sidebarCollapsed } = useUIStore()

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <Sidebar />
      <div
        className={cn(
          'transition-all duration-300',
          sidebarCollapsed ? 'ml-16' : 'ml-60'
        )}
      >
        <TopHeader />
        <main className="p-6">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            key={location.pathname}
          >
            <Outlet />
          </motion.div>
        </main>
      </div>
    </div>
  )
}
