import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { motion, AnimatePresence } from 'framer-motion'
import { Loader2, AlertCircle, CheckCircle2 } from 'lucide-react'
import { forgotPasswordSchema, resetPasswordSchema, type ForgotPasswordFormData, type ResetPasswordFormData } from '@/lib/validators'
import { getPasswordStrength } from '@/lib/utils'
import { authApi } from '@/api/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { StepIndicator } from '@/components/shared/StepIndicator'

const steps = [
  { label: 'Enter Email' },
  { label: 'Verify OTP' },
  { label: 'New Password' },
]

export default function ForgotPassword() {
  const [currentStep, setCurrentStep] = useState(0)
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [countdown, setCountdown] = useState(0)

  // OTP inputs refs
  const otpRefs = useRef<(HTMLInputElement | null)[]>([])
  const [otpValues, setOtpValues] = useState<string[]>(Array(6).fill(''))

  // Step 1: Email form
  const emailForm = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  })

  // Step 3: Reset form
  const resetForm = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  })

  const resetPassword = resetForm.watch('password', '')
  const strength = getPasswordStrength(resetPassword)

  // Countdown timer for OTP resend
  useEffect(() => {
    if (countdown <= 0) return
    const timer = setInterval(() => setCountdown((c) => c - 1), 1000)
    return () => clearInterval(timer)
  }, [countdown])

  const handleSendOtp = async (data: ForgotPasswordFormData) => {
    setError('')
    setLoading(true)
    try {
      await authApi.forgotPassword(data.email)
      setEmail(data.email)
      setCountdown(120)
      setCurrentStep(1)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to send OTP')
    } finally {
      setLoading(false)
    }
  }

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return
    const newValues = [...otpValues]
    newValues[index] = value.slice(-1)
    setOtpValues(newValues)

    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus()
    }
  }

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otpValues[index] && index > 0) {
      otpRefs.current[index - 1]?.focus()
    }
  }

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    const newValues = [...otpValues]
    pasted.split('').forEach((char, i) => {
      newValues[i] = char
    })
    setOtpValues(newValues)
    if (pasted.length > 0) {
      otpRefs.current[Math.min(pasted.length, 5)]?.focus()
    }
  }

  const handleVerifyOtp = async () => {
    const otpCode = otpValues.join('')
    if (otpCode.length !== 6) {
      setError('Please enter the complete 6-digit code')
      return
    }
    setError('')
    setLoading(true)
    try {
      await authApi.verifyOtp(email, otpCode)
      setOtp(otpCode)
      setCurrentStep(2)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Invalid OTP')
    } finally {
      setLoading(false)
    }
  }

  const handleResetPassword = async (data: ResetPasswordFormData) => {
    setError('')
    setLoading(true)
    try {
      await authApi.resetPassword(email, otp, data.password)
      setSuccess(true)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to reset password')
    } finally {
      setLoading(false)
    }
  }

  const formatCountdown = (secs: number) => {
    const m = Math.floor(secs / 60)
    const s = secs % 60
    return `${m}:${String(s).padStart(2, '0')}`
  }

  if (success) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center"
      >
        {/* Animated checkmark */}
        <div className="mx-auto w-20 h-20 rounded-full bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center mb-6">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          >
            <CheckCircle2 className="w-12 h-12 text-emerald-500" />
          </motion.div>
        </div>
        <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-2">
          Password reset successfully!
        </h2>
        <p className="text-slate-500 mb-8">You can now sign in with your new password.</p>
        <Link to="/login">
          <Button className="w-full h-11">Go to Login →</Button>
        </Link>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-1">
        Reset Password
      </h2>
      <p className="text-slate-500 mb-8">Recover access to your account</p>

      <StepIndicator steps={steps} currentStep={currentStep} className="mb-8" />

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 flex items-center gap-2 text-sm text-red-600"
        >
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </motion.div>
      )}

      <AnimatePresence mode="wait">
        {/* Step 1: Email */}
        {currentStep === 0 && (
          <motion.form
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            onSubmit={emailForm.handleSubmit(handleSendOtp)}
            className="space-y-5"
          >
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@company.com"
                autoFocus
                {...emailForm.register('email')}
                className={emailForm.formState.errors.email ? 'border-red-500' : ''}
              />
              {emailForm.formState.errors.email && (
                <p className="text-xs text-red-500">{emailForm.formState.errors.email.message}</p>
              )}
            </div>
            <Button type="submit" className="w-full h-11" disabled={loading}>
              {loading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Sending OTP...</>
              ) : ('Send OTP')}
            </Button>
          </motion.form>
        )}

        {/* Step 2: OTP */}
        {currentStep === 1 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="space-y-5"
          >
            <p className="text-sm text-slate-500 text-center">
              OTP sent to <span className="font-medium text-slate-700 dark:text-slate-300">{email}</span>
            </p>

            <div className="flex justify-center gap-2" onPaste={handleOtpPaste}>
              {otpValues.map((val, i) => (
                <input
                  key={i}
                  ref={(el) => { otpRefs.current[i] = el }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={val}
                  onChange={(e) => handleOtpChange(i, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(i, e)}
                  className="w-12 h-14 text-center text-xl font-semibold border border-slate-200 dark:border-slate-700 rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                />
              ))}
            </div>

            <div className="text-center text-sm text-slate-500">
              {countdown > 0 ? (
                <span>Resend OTP in {formatCountdown(countdown)}</span>
              ) : (
                <button
                  onClick={() => {
                    setCountdown(120)
                    authApi.forgotPassword(email)
                  }}
                  className="text-indigo-600 hover:underline font-medium"
                >
                  Resend OTP
                </button>
              )}
            </div>

            <Button onClick={handleVerifyOtp} className="w-full h-11" disabled={loading}>
              {loading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Verifying...</>
              ) : ('Verify OTP')}
            </Button>
          </motion.div>
        )}

        {/* Step 3: New Password */}
        {currentStep === 2 && (
          <motion.form
            key="step3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            onSubmit={resetForm.handleSubmit(handleResetPassword)}
            className="space-y-5"
          >
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                type="password"
                placeholder="••••••••"
                {...resetForm.register('password')}
                className={resetForm.formState.errors.password ? 'border-red-500' : ''}
              />
              {resetForm.formState.errors.password && (
                <p className="text-xs text-red-500">{resetForm.formState.errors.password.message}</p>
              )}
              {resetPassword.length > 0 && (
                <div className="space-y-1.5">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4].map((s) => (
                      <div
                        key={s}
                        className={`h-1.5 flex-1 rounded-full transition-colors ${
                          s <= strength.score ? strength.color : 'bg-slate-200 dark:bg-slate-700'
                        }`}
                      />
                    ))}
                  </div>
                  <p className={`text-xs ${strength.score <= 2 ? 'text-orange-500' : 'text-emerald-600'}`}>
                    {strength.label}
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                {...resetForm.register('confirmPassword')}
                className={resetForm.formState.errors.confirmPassword ? 'border-red-500' : ''}
              />
              {resetForm.formState.errors.confirmPassword && (
                <p className="text-xs text-red-500">{resetForm.formState.errors.confirmPassword.message}</p>
              )}
            </div>

            <Button type="submit" className="w-full h-11" disabled={loading}>
              {loading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Resetting...</>
              ) : ('Reset Password')}
            </Button>
          </motion.form>
        )}
      </AnimatePresence>

      <p className="text-center text-sm text-slate-500 mt-8">
        <Link to="/login" className="text-indigo-600 hover:text-indigo-700 font-medium">
          ← Back to Login
        </Link>
      </p>
    </motion.div>
  )
}
