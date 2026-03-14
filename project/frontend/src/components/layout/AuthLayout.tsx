import { Outlet } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Boxes, Check } from 'lucide-react'

const features = [
  'Multi-warehouse support',
  'Full stock ledger',
  'Smart low-stock alerts',
]

export function AuthLayout() {
  return (
    <div className="min-h-screen flex">
      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-slate-900 relative overflow-hidden flex-col justify-between p-12">
        {/* Dot pattern overlay */}
        <div className="absolute inset-0 dot-pattern opacity-40" />

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center">
            <Boxes className="w-6 h-6 text-white" />
          </div>
          <span className="text-white font-bold text-xl">CoreInventory</span>
        </div>

        {/* Tagline */}
        <div className="relative z-10 space-y-8">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="text-4xl font-bold text-white leading-tight"
          >
            Real-time inventory.
            <br />
            <span className="text-indigo-400">Zero guesswork.</span>
          </motion.h1>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="space-y-4"
          >
            {features.map((feature) => (
              <div key={feature} className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-indigo-500/20 flex items-center justify-center">
                  <Check className="w-4 h-4 text-indigo-400" />
                </div>
                <span className="text-slate-300 text-base">{feature}</span>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Bottom decorative element */}
        <div className="relative z-10">
          <p className="text-slate-500 text-sm">
            © {new Date().getFullYear()} CoreInventory. Built for modern operations.
          </p>
        </div>

        {/* Gradient glow effects */}
        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl" />
        <div className="absolute -top-16 -right-16 w-72 h-72 bg-purple-600/10 rounded-full blur-3xl" />
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white dark:bg-slate-900">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md"
        >
          <Outlet />
        </motion.div>
      </div>
    </div>
  )
}
