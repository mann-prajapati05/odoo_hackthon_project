import { axiosInstance } from '@/lib/axiosInstance'
import type { AuthResponse } from '@/types'

export const authApi = {
  login: async (email: string, password: string): Promise<AuthResponse> => {
    const { data } = await axiosInstance.post('/auth/login', { email, password })
    return data
  },

  signup: async (name: string, email: string, password: string): Promise<AuthResponse> => {
    const { data } = await axiosInstance.post('/auth/signup', { name, email, password })
    return data
  },

  forgotPassword: async (email: string) => {
    const { data } = await axiosInstance.post('/auth/forgot-password', { email })
    return data
  },

  verifyOtp: async (email: string, otp: string) => {
    const { data } = await axiosInstance.post('/auth/verify-otp', { email, otp })
    return data
  },

  resetPassword: async (email: string, otp: string, newPassword: string) => {
    const { data } = await axiosInstance.post('/auth/reset-password', { email, otp, newPassword })
    return data
  },

  refresh: async (): Promise<AuthResponse> => {
    const { data } = await axiosInstance.post('/auth/refresh')
    return data
  },

  logout: async () => {
    await axiosInstance.post('/auth/logout')
  },
}
