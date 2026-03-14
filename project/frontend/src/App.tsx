import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import { queryClient } from '@/lib/queryClient'
import { useAuthStore, useUIStore } from '@/store'
import { useEffect } from 'react'
import { authApi } from '@/api/auth'
import { usersApi } from '@/api/users'

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
import ProductCreate from '@/pages/ProductCreate'
import OperationListPage from '@/pages/OperationListPage'
import OperationDetail from '@/pages/OperationDetail'
import OperationCreate from '@/pages/OperationCreate'
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

function SessionInitializer() {
  const location = useLocation()
  const { setAuth, clearAuth, isAuthenticated } = useAuthStore()
  const isAuthPage = location.pathname === '/login' || location.pathname === '/signup' || location.pathname === '/forgot-password'

  useEffect(() => {
    if (isAuthenticated || isAuthPage) return

    const restore = async () => {
      try {
        const refreshed = await authApi.refresh()
        const me = await usersApi.me()
        setAuth(refreshed.accessToken, me)
      } catch {
        clearAuth()
      }
    }

    void restore()
  }, [clearAuth, isAuthenticated, isAuthPage, setAuth])

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
          <SessionInitializer />
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
              <Route path="/products/new" element={<ProductCreate />} />
              <Route path="/products/:id" element={<ProductDetail />} />

              {/* Operations */}
              <Route
                path="/operations/receipts"
                element={<OperationListPage type="receipt" title="Receipts" newRoute="/operations/receipts/new" />}
              />
              <Route
                path="/operations/receipts/new"
                element={<OperationCreate type="receipt" title="Receipts" listRoute="/operations/receipts" />}
              />
              <Route path="/operations/receipts/:id" element={<OperationDetail />} />

              <Route
                path="/operations/deliveries"
                element={<OperationListPage type="delivery" title="Deliveries" newRoute="/operations/deliveries/new" />}
              />
              <Route
                path="/operations/deliveries/new"
                element={<OperationCreate type="delivery" title="Deliveries" listRoute="/operations/deliveries" />}
              />
              <Route path="/operations/deliveries/:id" element={<OperationDetail />} />

              <Route
                path="/operations/transfers"
                element={<OperationListPage type="transfer" title="Transfers" newRoute="/operations/transfers/new" />}
              />
              <Route
                path="/operations/transfers/new"
                element={<OperationCreate type="transfer" title="Transfers" listRoute="/operations/transfers" />}
              />
              <Route path="/operations/transfers/:id" element={<OperationDetail />} />

              <Route
                path="/operations/adjustments"
                element={<OperationListPage type="adjustment" title="Adjustments" newRoute="/operations/adjustments/new" />}
              />
              <Route
                path="/operations/adjustments/new"
                element={<OperationCreate type="adjustment" title="Adjustments" listRoute="/operations/adjustments" />}
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
