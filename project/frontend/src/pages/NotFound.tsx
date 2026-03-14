import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Home, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="text-center px-4"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
          className="text-8xl font-bold text-indigo-600 dark:text-indigo-400 mb-4"
        >
          404
        </motion.div>
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-white mb-2">
          Page not found
        </h1>
        <p className="text-slate-500 mb-8 max-w-sm mx-auto">
          The page you were looking for doesn't exist or has been moved.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Link to="/dashboard">
            <Button className="gap-2">
              <Home className="w-4 h-4" /> Go to Dashboard
            </Button>
          </Link>
          <Button variant="outline" onClick={() => window.history.back()} className="gap-2">
            <ArrowLeft className="w-4 h-4" /> Go back
          </Button>
        </div>
      </motion.div>
    </div>
  )
}
