import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(1, 'Password is required'),
})

export const signupSchema = z
  .object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Please enter a valid email'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  })

export const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email'),
})

export const resetPasswordSchema = z
  .object({
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  })

export const productSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  sku: z.string().min(1, 'SKU is required'),
  categoryId: z.string().min(1, 'Category is required'),
  uom: z.string().min(1, 'Unit of measure is required'),
  description: z.string().optional(),
  reorderEnabled: z.boolean().default(false),
  minStockLevel: z.number().min(0).optional(),
  reorderQty: z.number().min(0).optional(),
  initialQty: z.number().min(0).optional(),
  warehouseId: z.string().optional(),
  locationId: z.string().optional(),
})

export const operationSchema = z.object({
  supplierName: z.string().optional(),
  destinationName: z.string().optional(),
  scheduledDate: z.string().min(1, 'Date is required'),
  warehouseId: z.string().min(1, 'Warehouse is required'),
  notes: z.string().optional(),
})

export const warehouseSchema = z.object({
  name: z.string().min(1, 'Warehouse name is required'),
  shortCode: z.string().min(1, 'Short code is required').max(10),
  address: z.string().optional(),
})

export const locationSchema = z.object({
  name: z.string().min(1, 'Location name is required'),
  shortCode: z.string().min(1, 'Short code is required').max(10),
  parentId: z.string().optional(),
})

export const profileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email'),
})

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  })

export type LoginFormData = z.infer<typeof loginSchema>
export type SignupFormData = z.infer<typeof signupSchema>
export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>
export type ProductFormData = z.infer<typeof productSchema>
export type OperationFormData = z.infer<typeof operationSchema>
export type WarehouseFormData = z.infer<typeof warehouseSchema>
export type LocationFormData = z.infer<typeof locationSchema>
export type ProfileFormData = z.infer<typeof profileSchema>
export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>
