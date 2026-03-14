import { create } from 'zustand'
import type { User, AlertItem, AdjustmentDraftState } from '@/types'

// ============================================================
// Auth Slice
// ============================================================
interface AuthState {
  accessToken: string | null
  user: User | null
  isAuthenticated: boolean
  setAuth: (token: string, user: User) => void
  setAccessToken: (token: string | null) => void
  clearAuth: () => void
  updateUser: (user: Partial<User>) => void
}

export const useAuthStore = create<AuthState>((set, get) => ({
  accessToken: null,
  user: null,
  isAuthenticated: false,
  setAuth: (token, user) => set({ accessToken: token, user, isAuthenticated: true }),
  setAccessToken: (token) =>
    set((state) => ({
      accessToken: token,
      isAuthenticated: Boolean(token && state.user),
    })),
  clearAuth: () => set({ accessToken: null, user: null, isAuthenticated: false }),
  updateUser: (updates) => {
    const current = get().user
    if (current) {
      set({ user: { ...current, ...updates } })
    }
  },
}))

// ============================================================
// UI Slice
// ============================================================
interface UIState {
  sidebarCollapsed: boolean
  toggleSidebar: () => void
  darkMode: boolean
  toggleDarkMode: () => void
  commandPaletteOpen: boolean
  setCommandPaletteOpen: (open: boolean) => void
  pageTitle: string
  setPageTitle: (title: string) => void
  breadcrumbs: Array<{ label: string; href?: string }>
  setBreadcrumbs: (crumbs: Array<{ label: string; href?: string }>) => void
}

export const useUIStore = create<UIState>((set) => ({
  sidebarCollapsed: false,
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  darkMode: localStorage.getItem('darkMode') === 'true',
  toggleDarkMode: () =>
    set((state) => {
      const newMode = !state.darkMode
      localStorage.setItem('darkMode', String(newMode))
      if (newMode) {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }
      return { darkMode: newMode }
    }),
  commandPaletteOpen: false,
  setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),
  pageTitle: 'Dashboard',
  setPageTitle: (title) => set({ pageTitle: title }),
  breadcrumbs: [],
  setBreadcrumbs: (crumbs) => set({ breadcrumbs: crumbs }),
}))

// ============================================================
// Notification Slice
// ============================================================
interface NotificationState {
  alerts: AlertItem[]
  unreadCount: number
  setAlerts: (alerts: AlertItem[]) => void
  markAllRead: () => void
}

export const useNotificationStore = create<NotificationState>((set) => ({
  alerts: [],
  unreadCount: 0,
  setAlerts: (alerts) =>
    set({
      alerts,
      unreadCount: alerts.filter((a) => !a.read).length,
    }),
  markAllRead: () =>
    set((state) => ({
      alerts: state.alerts.map((a) => ({ ...a, read: true })),
      unreadCount: 0,
    })),
}))

// ============================================================
// Session Slice
// ============================================================
interface SessionState {
  currentAdjustmentDraft: AdjustmentDraftState | null
  setAdjustmentDraft: (draft: AdjustmentDraftState | null) => void
  clearAdjustmentDraft: () => void
}

export const useSessionStore = create<SessionState>((set) => ({
  currentAdjustmentDraft: null,
  setAdjustmentDraft: (draft) => set({ currentAdjustmentDraft: draft }),
  clearAdjustmentDraft: () => set({ currentAdjustmentDraft: null }),
}))
