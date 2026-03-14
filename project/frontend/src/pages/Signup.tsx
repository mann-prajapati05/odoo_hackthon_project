import { useEffect, useRef, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { motion } from 'framer-motion'
import { Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react'
import { signupSchema, type SignupFormData } from '@/lib/validators'
import { useAuthStore } from '@/store'
import { authApi } from '@/api/auth'
import { getPasswordStrength } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { StepIndicator } from '@/components/shared/StepIndicator'
import toast from 'react-hot-toast'

const getApiErrorMessage = (err: unknown, fallback: string): string => {
  if (err && typeof err === 'object' && 'response' in err) {
    const response = (err as { response?: { data?: unknown } }).response
    const data = response?.data as
      | {
          message?: string
          error?: string
          issues?: Record<string, string[] | undefined>
        }
      | undefined

    if (data?.issues) {
      const firstField = Object.keys(data.issues)[0]
      const firstIssue = firstField ? data.issues[firstField]?.[0] : undefined
      if (firstIssue) return firstIssue
    }

    if (data?.message) return data.message
    if (data?.error) return data.error
  }

  if (err instanceof Error) return err.message
  return fallback
}

const steps = [{ label: 'Account Details' }, { label: 'Verify OTP' }]

export default function Signup() {
  const [currentStep, setCurrentStep] = useState(0)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const [pendingSignup, setPendingSignup] = useState<{
    name: string
    email: string
    password: string
  } | null>(null)
  const [otpValues, setOtpValues] = useState<string[]>(Array(6).fill(''))
  const otpRefs = useRef<(HTMLInputElement | null)[]>([])
  const { setAuth } = useAuthStore()
  const navigate = useNavigate()

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
  })

  const password = watch('password', '')
  const strength = getPasswordStrength(password)

  useEffect(() => {
    if (countdown <= 0) return
    const timer = setInterval(() => setCountdown((c) => c - 1), 1000)
    return () => clearInterval(timer)
  }, [countdown])

  const onSubmit = async (data: SignupFormData) => {
    setError('')
    setLoading(true)
    try {
      await authApi.signup(data.name, data.email, data.password)
      setPendingSignup({ name: data.name, email: data.email, password: data.password })
      setOtpValues(Array(6).fill(''))
      setCurrentStep(1)
      setCountdown(120)
      toast.success('OTP sent to your email')
    } catch (err: unknown) {
      const message = getApiErrorMessage(err, 'Failed to create account')
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return
    const next = [...otpValues]
    next[index] = value.slice(-1)
    setOtpValues(next)
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
    const next = [...otpValues]
    pasted.split('').forEach((char, i) => {
      next[i] = char
    })
    setOtpValues(next)
    if (pasted.length > 0) {
      otpRefs.current[Math.min(pasted.length, 5)]?.focus()
    }
  }

  const handleVerifyOtp = async () => {
    if (!pendingSignup) {
      setCurrentStep(0)
      return
    }

    const otp = otpValues.join('')
    if (otp.length !== 6) {
      setError('Please enter the complete 6-digit OTP')
      return
    }

    setError('')
    setLoading(true)
    try {
      const res = await authApi.verifySignupOtp(pendingSignup.email, otp)
      setAuth(res.accessToken, res.user)
      toast.success('Account created successfully!')
      navigate('/dashboard')
    } catch (err: unknown) {
      const message = getApiErrorMessage(err, 'Failed to verify OTP')
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  const handleResendOtp = async () => {
    if (!pendingSignup || countdown > 0) return

    setError('')
    setLoading(true)
    try {
      await authApi.signup(pendingSignup.name, pendingSignup.email, pendingSignup.password)
      setCountdown(120)
      setOtpValues(Array(6).fill(''))
      toast.success('OTP resent successfully')
    } catch (err: unknown) {
      const message = getApiErrorMessage(err, 'Failed to resend OTP')
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  const formatCountdown = (secs: number) => {
    const m = Math.floor(secs / 60)
    const s = secs % 60
    return `${m}:${String(s).padStart(2, '0')}`
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-1">
        Create your account
      </h2>
      <p className="text-slate-500 mb-8">Get started with CoreInventory</p>

      <StepIndicator steps={steps} currentStep={currentStep} className="mb-8" />

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 flex items-center gap-2 text-sm text-red-600 dark:text-red-400"
        >
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </motion.div>
      )}

      {currentStep === 0 ? (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              placeholder="John Doe"
              autoFocus
              {...register('name')}
              className={errors.name ? 'border-red-500' : ''}
            />
            {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@company.com"
              {...register('email')}
              className={errors.email ? 'border-red-500' : ''}
            />
            {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                {...register('password')}
                className={errors.password ? 'border-red-500 pr-10' : 'pr-10'}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}

            {password.length > 0 && (
              <div className="space-y-1.5">
                <div className="flex gap-1">
                  {[1, 2, 3, 4].map((segment) => (
                    <div
                      key={segment}
                      className={`h-1.5 flex-1 rounded-full transition-colors ${
                        segment <= strength.score ? strength.color : 'bg-slate-200 dark:bg-slate-700'
                      }`}
                    />
                  ))}
                </div>
                <p
                  className={`text-xs ${
                    strength.score <= 1
                      ? 'text-red-500'
                      : strength.score <= 2
                        ? 'text-orange-500'
                        : strength.score <= 3
                          ? 'text-yellow-600'
                          : 'text-emerald-600'
                  }`}
                >
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
              {...register('confirmPassword')}
              className={errors.confirmPassword ? 'border-red-500' : ''}
            />
            {errors.confirmPassword && (
              <p className="text-xs text-red-500">{errors.confirmPassword.message}</p>
            )}
          </div>

          <Button type="submit" className="w-full h-11" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Sending OTP...
              </>
            ) : (
              'Send OTP'
            )}
          </Button>
        </form>
      ) : (
        <div className="space-y-5">
          <p className="text-sm text-slate-500 text-center">
            Enter the 6-digit OTP sent to{' '}
            <span className="font-medium text-slate-700 dark:text-slate-300">{pendingSignup?.email}</span>
          </p>

          <div className="flex justify-center gap-2" onPaste={handleOtpPaste}>
            {otpValues.map((value, index) => (
              <input
                key={index}
                ref={(el) => {
                  otpRefs.current[index] = el
                }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={value}
                onChange={(e) => handleOtpChange(index, e.target.value)}
                onKeyDown={(e) => handleOtpKeyDown(index, e)}
                className="w-12 h-14 text-center text-xl font-semibold border border-slate-200 dark:border-slate-700 rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
              />
            ))}
          </div>

          <div className="text-center text-sm text-slate-500">
            {countdown > 0 ? (
              <span>Resend OTP in {formatCountdown(countdown)}</span>
            ) : (
              <button
                type="button"
                onClick={handleResendOtp}
                className="text-indigo-600 hover:underline font-medium"
              >
                Resend OTP
              </button>
            )}
          </div>

          <Button type="button" onClick={handleVerifyOtp} className="w-full h-11" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Verifying OTP...
              </>
            ) : (
              'Verify OTP & Create Account'
            )}
          </Button>
        </div>
      )}

      <p className="text-center text-sm text-slate-500 mt-8">
        Already have an account?{' '}
        <Link to="/login" className="text-indigo-600 hover:text-indigo-700 font-medium">
          Sign in →
        </Link>
      </p>
    </motion.div>
  )
}
