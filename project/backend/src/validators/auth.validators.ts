import { z } from "zod";

const passwordRule = z
  .string()
  .min(8)
  .regex(/[A-Z]/, "Must include at least one uppercase letter")
  .regex(/[0-9]/, "Must include at least one number")
  .regex(/[^A-Za-z0-9]/, "Must include at least one special character");

export const signupSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: passwordRule,
});

export const verifySignupOtpSchema = z.object({
  email: z.string().email(),
  otp: z.string().regex(/^\d{6}$/, "OTP must be a 6-digit code"),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

export const verifyOtpSchema = z.object({
  email: z.string().email(),
  otp: z.string().regex(/^\d{6}$/, "OTP must be a 6-digit code"),
});

const resetWithTokenSchema = z.object({
  resetToken: z.string().min(1),
  password: passwordRule,
  confirmPassword: z.string().min(8),
});

const resetWithOtpSchema = z.object({
  email: z.string().email(),
  otp: z.string().regex(/^\d{6}$/, "OTP must be a 6-digit code"),
  password: passwordRule,
  confirmPassword: z.string().min(8),
});

export const resetPasswordSchema = z.union([resetWithTokenSchema, resetWithOtpSchema]);

export const updatePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: passwordRule,
  confirmPassword: z.string().min(8),
});
