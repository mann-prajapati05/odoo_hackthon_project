import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import { queryClient } from '@/lib/queryClient'
import { useAuthStore, useUIStore } from '@/store'
import { useEffect } from 'react'

// Layouts
import { ShellLayout } from '@/components/layout/ShellLayout'
import { AuthLayout } from '@/components/layout/AuthLayout'

// Auth Pages
import Login from '@/pages/Login'
import Signup from '@/pages/Signup'
import ForgotPassword from '@/pages/ForgotPassword'

// App Pages
import Dashboard from '@/pages/Dashboard'
import ProductList from '@/pages/ProductList'
import ProductDetail from '@/pages/ProductDetail'
import OperationListPage from '@/pages/OperationListPage'
import OperationDetail from '@/pages/OperationDetail'
import MoveHistory from '@/pages/MoveHistory'
import Warehouses from '@/pages/Warehouses'
import Profile from '@/pages/Profile'
import NotFound from '@/pages/NotFound'

// Shared
import { CommandPalette } from '@/components/shared/CommandPalette'
import { TooltipProvider } from '@/components/ui/tooltip'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return <>{children}</>
}

function GuestRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore()
  if (isAuthenticated) return <Navigate to="/dashboard" replace />
  return <>{children}</>
}

// ⚠️ DEMO MODE — Remove this component once you connect the real backend
function DemoAuthInitializer() {
  const { isAuthenticated, setAuth } = useAuthStore()
  const demoAuthEnabled = import.meta.env.VITE_DEMO_AUTH === 'true'

  useEffect(() => {
    if (!demoAuthEnabled) return

    if (!isAuthenticated) {
      setAuth('demo-token', {
        id: 'demo-1',
        name: 'Rohan Prajapati',
        email: 'rohan@coreinventory.com',
        role: 'admin',
        createdAt: new Date().toISOString(),
      })
    }
  }, [demoAuthEnabled, isAuthenticated, setAuth])
  return null
}

function DarkModeInitializer() {
  const { darkMode } = useUIStore()
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [darkMode])
  return null
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider delayDuration={0}>
        <BrowserRouter>
          <DemoAuthInitializer />
          <DarkModeInitializer />
          <CommandPalette />
          <Toaster
            position="top-right"
            toastOptions={{
              className: 'text-sm font-medium',
              style: { background: '#1e293b', color: '#f8fafc', borderRadius: '12px', padding: '12px 16px' },
              success: { iconTheme: { primary: '#10b981', secondary: '#fff' } },
              error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
            }}
          />

          <Routes>
            {/* Auth routes */}
            <Route
              element={
                <GuestRoute>
                  <AuthLayout />
                </GuestRoute>
              }
            >
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
            </Route>

            {/* App routes */}
            <Route
              element={
                <ProtectedRoute>
                  <ShellLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/dashboard" element={<Dashboard />} />

              {/* Products */}
              <Route path="/products" element={<ProductList />} />
              <Route path="/products/:id" element={<ProductDetail />} />

              {/* Operations */}
              <Route
                path="/operations/receipts"
                element={<OperationListPage type="receipt" title="Receipts" newRoute="/operations/receipts/new" />}
              />
              <Route path="/operations/receipts/:id" element={<OperationDetail />} />

              <Route
                path="/operations/deliveries"
                element={<OperationListPage type="delivery" title="Deliveries" newRoute="/operations/deliveries/new" />}
              />
              <Route path="/operations/deliveries/:id" element={<OperationDetail />} />

              <Route
                path="/operations/transfers"
                element={<OperationListPage type="transfer" title="Transfers" newRoute="/operations/transfers/new" />}
              />
              <Route path="/operations/transfers/:id" element={<OperationDetail />} />

              <Route
                path="/operations/adjustments"
                element={<OperationListPage type="adjustment" title="Adjustments" newRoute="/operations/adjustments/new" />}
              />
              <Route path="/operations/adjustments/:id" element={<OperationDetail />} />

              {/* Move History */}
              <Route path="/move-history" element={<MoveHistory />} />

              {/* Settings */}
              <Route path="/settings/warehouses" element={<Warehouses />} />
              <Route path="/profile" element={<Profile />} />
            </Route>

            {/* Redirects / 404 */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  )
}

export default App
