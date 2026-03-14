import { axiosInstance } from '@/lib/axiosInstance'
import { mapUser } from '@/lib/mappers'
import type { User, UserStats } from '@/types'

export const usersApi = {
  me: async (): Promise<User> => {
    const { data } = await axiosInstance.get('/users/me')
    return mapUser(data)
  },

  updateMe: async (name: string): Promise<User> => {
    const { data } = await axiosInstance.put('/users/me', { name })
    return mapUser(data)
  },

  changePassword: async (payload: {
    currentPassword: string
    newPassword: string
    confirmPassword: string
  }): Promise<{ message: string }> => {
    const { data } = await axiosInstance.put('/users/me/password', payload)
    return data
  },

  stats: async (): Promise<UserStats> => {
    const { data } = await axiosInstance.get('/users/me/stats')
    return {
      totalOperations: Number(data.operationsCreated || 0),
      receiptsValidated: Number(data.receiptsValidated || 0),
      deliveriesCompleted: Number(data.deliveriesCompleted || 0),
      lastActive: String(data.lastActiveAt || new Date().toISOString()),
    }
  },
}
